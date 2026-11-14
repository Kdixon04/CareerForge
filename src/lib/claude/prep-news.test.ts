import { describe, expect, it } from 'vitest';
import { searchNews } from './prep-news';

describe('searchNews', () => {
  it('returns empty list with enabled: false when provider is none', async () => {
    const result = await searchNews('Acme Corp', {
      provider: 'none',
      apiKey: 'sk-ant-test',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.enabled).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.provider).toBe('none');
  });

  it('returns empty list when provider is claude_web but API key is absent', async () => {
    const result = await searchNews('Acme Corp', {
      provider: 'claude_web',
      apiKey: undefined,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.enabled).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.provider).toBe('unconfigured');
  });

  it('returns HTTPS news items marked unverified: true matching Cursor PrepNewsItem shape', async () => {
    const mockOutput = JSON.stringify({
      items: [
        {
          title: 'Acme Corp Expands Cloud Infrastructure',
          source: 'Tech Chronicle',
          url: 'https://news.example.com/acme-expansion',
          summary: 'Acme announced a major expansion of its cloud services.',
          publishedAt: '2026-11-01',
        },
      ],
    });

    const result = await searchNews('Acme Corp', {
      provider: 'claude_web',
      apiKey: 'sk-ant-test',
      modelCaller: async () => ({ ok: true, content: mockOutput }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.enabled).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].source).toBe('Tech Chronicle');
    expect(result.items[0].summary).toContain('major expansion');
    expect(result.items[0].url).toMatch(/^https:\/\//);
    expect(result.items[0].unverified).toBe(true);
  });

  it('rejects provider output containing non-HTTPS URLs', async () => {
    const mockOutput = JSON.stringify({
      items: [
        {
          title: 'Insecure News',
          source: 'Blog',
          url: 'http://insecure.example.com/article',
          summary: 'Not secure.',
          publishedAt: null,
        },
      ],
    });

    const result = await searchNews('Acme Corp', {
      provider: 'claude_web',
      apiKey: 'sk-ant-test',
      modelCaller: async () => ({ ok: true, content: mockOutput }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('PROVIDER_ERROR');
    expect(result.error).toContain('HTTPS-only');
  });

  it('rejects empty query', async () => {
    const result = await searchNews('   ');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('rejects oversized query', async () => {
    const result = await searchNews('Q'.repeat(101));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });
});
