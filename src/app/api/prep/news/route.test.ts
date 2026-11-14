import { describe, it, expect } from 'vitest';
import { handlePrepNews } from '../../../../lib/claude/prep-handlers';

const mockUserId = '11111111-1111-4111-a111-111111111111';

function createGetRequest(url: string): Request {
  return new Request(url, {
    method: 'GET',
  });
}

describe('GET /api/prep/news', () => {
  it('returns 401 when unauthenticated', async () => {
    const req = createGetRequest('http://localhost:3000/api/prep/news?query=Acme');
    const res = await handlePrepNews(req, {
      getUser: async () => null,
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when query parameter is missing', async () => {
    const req = createGetRequest('http://localhost:3000/api/prep/news');
    const res = await handlePrepNews(req, {
      getUser: async () => ({ id: mockUserId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 when query parameter is blank', async () => {
    const req = createGetRequest('http://localhost:3000/api/prep/news?query=%20%20');
    const res = await handlePrepNews(req, {
      getUser: async () => ({ id: mockUserId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 when query exceeds 100 characters', async () => {
    const longQuery = 'a'.repeat(101);
    const req = createGetRequest(`http://localhost:3000/api/prep/news?query=${longQuery}`);
    const res = await handlePrepNews(req, {
      getUser: async () => ({ id: mockUserId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 200 with enabled=false and empty items when provider is none (inert default)', async () => {
    const req = createGetRequest('http://localhost:3000/api/prep/news?query=Google');
    const res = await handlePrepNews(req, {
      getUser: async () => ({ id: mockUserId }),
      provider: 'none',
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.enabled).toBe(false);
    expect(json.data.items).toEqual([]);
    expect(json.data.note).toContain('disabled');
  });

  it('returns 200 with items when news search succeeds', async () => {
    const req = createGetRequest('http://localhost:3000/api/prep/news?query=Anthropic');
    const mockSearch = async () => ({
      ok: true as const,
      items: [
        {
          id: '12345678-1234-4234-a234-123456789012',
          title: 'Anthropic releases new research',
          source: 'Tech News',
          url: 'https://example.com/news/1',
          summary: 'Research paper on LLM safety was published today.',
          publishedAt: '2026-03-01',
          unverified: true as const,
        },
      ],
      enabled: true,
      provider: 'claude_web',
    });

    const res = await handlePrepNews(req, {
      getUser: async () => ({ id: mockUserId }),
      searchNewsFn: mockSearch,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.enabled).toBe(true);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].title).toBe('Anthropic releases new research');
    expect(json.data.items[0].source).toBe('Tech News');
    expect(json.data.items[0].summary).toContain('Research paper');
    expect(json.data.items[0].unverified).toBe(true);
  });
});
