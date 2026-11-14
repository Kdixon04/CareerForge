import { describe, expect, it } from 'vitest';
import {
  handleSuggestResume,
  handleGetResume,
  handlePatchResume,
  type ResumeDataAdapter,
} from './resume-handlers';
import type { ResumeVersion } from '../../contracts';
import { MAX_RAW_BODY_BYTES } from '../jobs/read-bounded-body';
import { exampleResumeSuggestion } from '../../data/examples';

const mockUserId = '11111111-1111-4111-8111-111111111111';
const mockResumeId = exampleResumeSuggestion.id;
const mockJobId = exampleResumeSuggestion.jobId;

function createPostRequest(
  body: unknown,
  options: { headers?: Record<string, string>; url?: string } = {},
): Request {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request(options.url ?? 'http://localhost:3000/api/resume/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: json,
  });
}

function createPatchRequest(body: unknown, headers: Record<string, string> = {}): Request {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request(`http://localhost:3000/api/resume/${mockResumeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: json,
  });
}

describe('handleSuggestResume (POST /api/resume/suggest)', () => {
  it('rejects signed-out requests with 401 UNAUTHENTICATED', async () => {
    const res = await handleSuggestResume(createPostRequest({ jobId: mockJobId }), {
      getUser: async () => null,
    });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
    });
  });

  it('rejects empty body with 400 INVALID_INPUT', async () => {
    const res = await handleSuggestResume(createPostRequest('   '), {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message).toContain('empty');
  });

  it('rejects malformed JSON with 400 INVALID_INPUT', async () => {
    const res = await handleSuggestResume(createPostRequest('{ broken'), {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message).toContain('valid JSON');
  });

  it('rejects invalid jobId with 400 INVALID_INPUT', async () => {
    const res = await handleSuggestResume(createPostRequest({ jobId: 'not-a-uuid' }), {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('rejects oversized Content-Length with 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await handleSuggestResume(
      createPostRequest({ jobId: mockJobId }, {
        headers: { 'content-length': String(MAX_RAW_BODY_BYTES + 1) },
      }),
      { getUser: async () => ({ id: mockUserId }) },
    );
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('fails closed with 503 when Anthropic key and modelCaller are absent', async () => {
    const res = await handleSuggestResume(createPostRequest({ jobId: mockJobId }), {
      getUser: async () => ({ id: mockUserId }),
      apiKey: '',
    });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(json.error.message).toContain('Anthropic');
  });

  it('fails closed with 503 when Keyan adapter pieces are absent (no fake ResumeVersion)', async () => {
    const res = await handleSuggestResume(createPostRequest({ jobId: mockJobId }), {
      getUser: async () => ({ id: mockUserId }),
      apiKey: 'sk-ant-test',
    });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(json.error.message).toContain('adapter');
  });
});

describe('handleGetResume (GET /api/resume/[id])', () => {
  it('rejects signed-out requests with 401 UNAUTHENTICATED', async () => {
    const res = await handleGetResume(mockResumeId, { getUser: async () => null });
    expect(res.status).toBe(401);
  });

  it('returns 404 NOT_FOUND for malformed UUID', async () => {
    const res = await handleGetResume('not-a-uuid', {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('fails closed with 503 while Keyan adapter is absent', async () => {
    const res = await handleGetResume(mockResumeId, {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(json.error.message).toContain('adapter');
  });

  it('returns 404 when adapter finds no owned resume', async () => {
    const adapter: Partial<ResumeDataAdapter> = {
      getOwnResumeVersion: async () => null,
    };
    const res = await handleGetResume(mockResumeId, {
      getUser: async () => ({ id: mockUserId }),
      adapter,
    });
    expect(res.status).toBe(404);
  });

  it('returns 200 with ResumeVersion when adapter returns owned row', async () => {
    const adapter: Partial<ResumeDataAdapter> = {
      getOwnResumeVersion: async () => exampleResumeSuggestion as ResumeVersion,
    };
    const res = await handleGetResume(mockResumeId, {
      getUser: async () => ({ id: mockUserId }),
      adapter,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(mockResumeId);
  });
});

describe('handlePatchResume (PATCH /api/resume/[id])', () => {
  const editedBullets = exampleResumeSuggestion.editedBullets;

  it('rejects signed-out requests with 401 UNAUTHENTICATED', async () => {
    const res = await handlePatchResume(mockResumeId, createPatchRequest({ editedBullets }), {
      getUser: async () => null,
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 NOT_FOUND for malformed UUID', async () => {
    const res = await handlePatchResume('bad-id', createPatchRequest({ editedBullets }), {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects missing editedBullets with 400 INVALID_INPUT', async () => {
    const res = await handlePatchResume(mockResumeId, createPatchRequest({}), {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('fails closed with 503 while Keyan adapter is absent', async () => {
    const res = await handlePatchResume(mockResumeId, createPatchRequest({ editedBullets }), {
      getUser: async () => ({ id: mockUserId }),
    });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(json.error.message).toContain('adapter');
  });

  it('returns 200 when adapter updates owned editedBullets', async () => {
    const updated = {
      ...exampleResumeSuggestion,
      editedBullets: [{ id: editedBullets[0]!.id, text: 'Updated student-authored bullet' }],
      updatedAt: new Date().toISOString(),
    } as ResumeVersion;

    const adapter: Partial<ResumeDataAdapter> = {
      updateOwnResumeEditedBullets: async () => updated,
    };

    const res = await handlePatchResume(
      mockResumeId,
      createPatchRequest({ editedBullets: updated.editedBullets }),
      { getUser: async () => ({ id: mockUserId }), adapter },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.editedBullets[0].text).toBe('Updated student-authored bullet');
  });
});
