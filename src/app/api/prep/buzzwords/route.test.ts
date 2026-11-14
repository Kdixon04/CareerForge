import { describe, it, expect } from 'vitest';
import { handlePrepBuzzwords } from '../../../../lib/claude/prep-handlers';
import type { JobPosting } from '../../../../contracts';

const mockUserId = '11111111-1111-4111-a111-111111111111';
const mockJobId = '22222222-2222-4222-a222-222222222222';

const mockJob: JobPosting = {
  id: mockJobId,
  title: 'Cloud Engineer',
  company: 'Cloud Corp',
  description: 'Looking for Kubernetes, Terraform, and distributed caching expertise.',
  location: 'Remote',
  jobType: 'full_time',
  workMode: 'remote',
  sourceUrl: null,
  deadline: null,
  source: 'pasted',
  providerName: null,
  externalId: null,
  createdByUserId: mockUserId,
  employerId: null,
  status: 'private',
  retrievedAt: null,
  deadlineVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createPostRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/prep/buzzwords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/prep/buzzwords', () => {
  it('returns 401 when unauthenticated', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const res = await handlePrepBuzzwords(req, {
      getUser: async () => null,
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when consent is missing', async () => {
    const req = createPostRequest({ jobId: mockJobId });
    const res = await handlePrepBuzzwords(req, {
      getUser: async () => ({ id: mockUserId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message).toContain('consent');
  });

  it('returns 400 when consent is false', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: false });
    const res = await handlePrepBuzzwords(req, {
      getUser: async () => ({ id: mockUserId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('fails closed with 503 when adapter is absent', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const res = await handlePrepBuzzwords(req, {
      getUser: async () => ({ id: mockUserId }),
      apiKey: 'sk-ant-test',
      // No getAuthorizedJob provided
    });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(json.error.message).toContain('adapter');
  });

  it('returns 404 when job does not exist', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const res = await handlePrepBuzzwords(req, {
      getUser: async () => ({ id: mockUserId }),
      apiKey: 'sk-ant-test',
      getAuthorizedJob: async () => null,
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 200 with extracted buzzwords on success', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const mockModelCaller = async () => ({
      ok: true as const,
      content: JSON.stringify({
        buzzwords: [
          {
            term: 'Kubernetes',
            definition: 'An open-source container orchestration system.',
            contextInJob: 'Referenced in requirements for container management.',
          },
        ],
      }),
    });

    const res = await handlePrepBuzzwords(req, {
      getUser: async () => ({ id: mockUserId }),
      apiKey: 'sk-ant-test',
      getAuthorizedJob: async () => mockJob,
      modelCaller: mockModelCaller,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.buzzwords).toHaveLength(1);
    expect(json.data.buzzwords[0].term).toBe('Kubernetes');
    expect(json.data.buzzwords[0].definition).toContain('container');
    expect(json.data.buzzwords[0].verified).toBe(false);
  });
});
