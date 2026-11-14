import { describe, expect, it, vi } from 'vitest';
import { readBoundedBody, MAX_RAW_BODY_BYTES } from './read-bounded-body';

function createStreamRequest(
  chunks: Uint8Array[],
  headers: Record<string, string> = {},
): Request {
  let chunkIndex = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (chunkIndex < chunks.length) {
        controller.enqueue(chunks[chunkIndex]);
        chunkIndex++;
      } else {
        controller.close();
      }
    },
  });

  return new Request('http://localhost:3000/api/jobs/parse', {
    method: 'POST',
    headers,
    body: stream,
    // @ts-expect-error duplex is required in Node fetch when body is a stream
    duplex: 'half',
  });
}

describe('readBoundedBody', () => {
  it('rejects immediately when Content-Length header exceeds limit', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('{"hello":"world"}');

    const request = new Request('http://localhost:3000/api/jobs/parse', {
      method: 'POST',
      headers: {
        'content-length': String(MAX_RAW_BODY_BYTES + 500),
      },
      body: data,
    });

    const result = await readBoundedBody(request, MAX_RAW_BODY_BYTES);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
      expect(result.code).toBe('PAYLOAD_TOO_LARGE');
      expect(result.message).toContain('100,000 bytes');
    }
  });

  it('rejects an oversized streamed body with no Content-Length header', async () => {
    // 3 chunks of 40,000 bytes = 120,000 bytes > 100,000 bytes
    const chunk1 = new Uint8Array(40_000).fill(65); // 'A'
    const chunk2 = new Uint8Array(40_000).fill(66); // 'B'
    const chunk3 = new Uint8Array(40_000).fill(67); // 'C'

    const request = createStreamRequest([chunk1, chunk2, chunk3]);

    const result = await readBoundedBody(request, MAX_RAW_BODY_BYTES);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
      expect(result.code).toBe('PAYLOAD_TOO_LARGE');
      expect(result.message).toContain('100,000 bytes');
    }
  });

  it('rejects an oversized streamed body when Content-Length header is spoofed/low', async () => {
    // Content-length header lies, claiming only 50 bytes
    const chunk1 = new Uint8Array(60_000).fill(65);
    const chunk2 = new Uint8Array(60_000).fill(66);

    const request = createStreamRequest([chunk1, chunk2], {
      'content-length': '50',
    });

    const result = await readBoundedBody(request, MAX_RAW_BODY_BYTES);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
      expect(result.code).toBe('PAYLOAD_TOO_LARGE');
    }
  });

  it('cancels the stream reader when the byte limit is exceeded', async () => {
    let cancelCalled = false;
    let chunksRead = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunksRead++;
        controller.enqueue(new Uint8Array(60_000).fill(88));
      },
      cancel() {
        cancelCalled = true;
      },
    });

    const request = new Request('http://localhost:3000/api/jobs/parse', {
      method: 'POST',
      body: stream,
      // @ts-expect-error duplex is required in Node fetch when body is a stream
      duplex: 'half',
    });

    const result = await readBoundedBody(request, MAX_RAW_BODY_BYTES);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
    // Stream reader should have cancelled after chunk 2 (120,000 bytes > 100,000 bytes)
    expect(cancelCalled).toBe(true);
    expect(chunksRead).toBeLessThanOrEqual(3);
  });

  it('accepts valid input below limit and decodes UTF-8 correctly', async () => {
    const jsonStr = JSON.stringify({ title: 'Junior Web Developer', company: 'North Star Labs' });
    const request = new Request('http://localhost:3000/api/jobs/parse', {
      method: 'POST',
      body: jsonStr,
    });

    const result = await readBoundedBody(request, MAX_RAW_BODY_BYTES);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe(jsonStr);
      expect(result.bytesRead).toBe(new TextEncoder().encode(jsonStr).byteLength);
    }
  });

  it('accepts multibyte text near the limit within boundary', async () => {
    // Multi-byte string: 3-byte unicode character '★' (U+2605: 3 bytes in UTF-8)
    // 25,000 stars * 3 bytes = 75,000 bytes (safely under 100,000 limit)
    const starStr = '★'.repeat(25_000);
    const bodyStr = JSON.stringify({ stars: starStr });

    const request = new Request('http://localhost:3000/api/jobs/parse', {
      method: 'POST',
      body: bodyStr,
    });

    const result = await readBoundedBody(request, MAX_RAW_BODY_BYTES);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bytesRead).toBeGreaterThan(75_000);
      expect(result.bytesRead).toBeLessThan(MAX_RAW_BODY_BYTES);
      const parsed = JSON.parse(result.text);
      expect(parsed.stars.length).toBe(25_000);
    }
  });
});
