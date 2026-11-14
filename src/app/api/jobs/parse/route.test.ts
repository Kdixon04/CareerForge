import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { MAX_RAW_BODY_BYTES } from '../../../../lib/jobs/read-bounded-body';

function createPostRequest(
  body: string | Uint8Array | ReadableStream<Uint8Array>,
  headers: Record<string, string> = {},
): NextRequest {
  const reqInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    duplex: 'half',
    body,
  };

  // NextRequest constructor options typing in Next.js 15
  return new NextRequest('http://localhost:3000/api/jobs/parse', reqInit as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

describe('POST /api/jobs/parse - raw body bounding and security', () => {
  it('returns 413 when Content-Length header exceeds raw byte limit', async () => {
    const validPayload = JSON.stringify({
      title: 'Junior Web Developer',
      company: 'North Star Labs',
      description: 'Build accessible web interfaces.',
    });

    const request = createPostRequest(validPayload, {
      'content-length': String(MAX_RAW_BODY_BYTES + 1),
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    const json = await response.json();
    expect(json).toEqual({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: expect.stringContaining('100,000 bytes'),
      },
    });
  });

  it('returns 413 when streamed body exceeds limit with no Content-Length header', async () => {
    // Stream 3 chunks of 40,000 bytes each = 120,000 bytes > 100,000 bytes
    let chunkIndex = 0;
    const chunks = [
      new Uint8Array(40_000).fill(65),
      new Uint8Array(40_000).fill(66),
      new Uint8Array(40_000).fill(67),
    ];

    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (chunkIndex < chunks.length) {
          controller.enqueue(chunks[chunkIndex++]);
        } else {
          controller.close();
        }
      },
    });

    const request = createPostRequest(stream);

    const response = await POST(request);

    expect(response.status).toBe(413);
    const json = await response.json();
    expect(json.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(json.error.message).toContain('100,000 bytes');
  });

  it('accepts valid input near the limit with multibyte text and returns 200', async () => {
    // Valid 20,000-character description with 2-byte characters (e.g. accented letters 'é')
    // 20,000 * 2 bytes = 40,000 bytes (within 100,000-byte limit)
    const multibyteDesc = 'é'.repeat(20_000);
    const payload = JSON.stringify({
      title: 'Senior Frontend Engineer',
      company: 'North Star Labs',
      description: multibyteDesc,
      location: 'Rexburg, ID',
      jobType: 'full_time',
      workMode: 'remote',
      sourceUrl: 'https://example.com/jobs/senior-frontend',
      deadline: '2026-12-15',
    });

    const byteLength = new TextEncoder().encode(payload).byteLength;
    expect(byteLength).toBeGreaterThan(40_000);
    expect(byteLength).toBeLessThan(MAX_RAW_BODY_BYTES);

    const request = createPostRequest(payload);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toBeDefined();
    expect(json.data.title).toBe('Senior Frontend Engineer');
    expect(json.data.company).toBe('North Star Labs');
    expect(json.data.description.length).toBe(20_000);
    expect(json.data.source).toBe('pasted');
    expect(json.data.status).toBe('private');
  });

  it('rejects description exceeding 20,000 characters even if raw body is under 100KB', async () => {
    // 20,001 ASCII characters = ~20,100 bytes (well under 100KB, but fails 20k char limit)
    const longDesc = 'a'.repeat(20_001);
    const payload = JSON.stringify({
      title: 'Junior Web Developer',
      company: 'North Star Labs',
      description: longDesc,
    });

    const request = createPostRequest(payload);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message).toContain('20000 characters');
  });

  it('returns 400 for empty request body', async () => {
    const request = createPostRequest('');
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({
      error: { code: 'INVALID_INPUT', message: 'Request body is empty' },
    });
  });

  it('returns 400 for invalid JSON', async () => {
    const request = createPostRequest('{ invalid json');
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({
      error: { code: 'INVALID_INPUT', message: 'Request body must be valid JSON' },
    });
  });

  it('never logs full job descriptions or personal data', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const secretDescription = 'CONFIDENTIAL_JOB_TEXT_DO_NOT_LOG_XYZ123';
    const payload = JSON.stringify({
      title: 'Software Engineer',
      company: 'Test Org',
      description: secretDescription,
    });

    const request = createPostRequest(payload);
    await POST(request);

    for (const call of consoleSpy.mock.calls) {
      const logMessage = call.join(' ');
      expect(logMessage).not.toContain(secretDescription);
      expect(logMessage).not.toContain('Software Engineer');
      expect(logMessage).not.toContain('Test Org');
    }

    consoleSpy.mockRestore();
  });
});
