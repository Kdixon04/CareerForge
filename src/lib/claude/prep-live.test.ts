import { describe, expect, it } from 'vitest';
import { searchNews } from './prep-news';

// Separately labeled guarded live smoke test.
// By default, this test is SKIPPED unless both ANTHROPIC_API_KEY is present
// and JOB_SEARCH_PROVIDER is explicitly configured to 'claude_web'.
// Routine CI, builds, and local test runs spend zero live credits.
describe('Interview Prep Hub live Claude & Search smoke (guarded)', () => {
  const isLiveConfigured = Boolean(
    process.env.ANTHROPIC_API_KEY && process.env.JOB_SEARCH_PROVIDER === 'claude_web',
  );

  it.skipIf(!isLiveConfigured)(
    'live news search endpoint returns HTTPS news items with unverified=true',
    async () => {
      const result = await searchNews('Google');
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.enabled).toBe(true);
      expect(result.provider).toBe('claude_web');
      expect(Array.isArray(result.items)).toBe(true);
      for (const item of result.items) {
        expect(item.url).toMatch(/^https:\/\//);
        expect(item.unverified).toBe(true);
      }
    },
  );
});
