import { z } from 'zod';
import type { ModelCaller } from './resume-suggest';

/** Matches Cursor's PrepNewsItem contract in src/app/(student)/jobs/prep-hub.ts */
export interface PrepNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string | null;
  summary: string;
  unverified: true;
}

export const NewsItemSchema = z.object({
  title: z.string().min(1).max(300),
  source: z.string().min(1).max(100).default('Web'),
  url: z.string().url().regex(/^https:\/\//, 'News URLs must be HTTPS-only'),
  summary: z.string().min(1).max(1000),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const NewsModelOutputSchema = z.object({
  items: z.array(NewsItemSchema).max(10),
});

export interface SearchNewsOptions {
  provider?: string;
  apiKey?: string;
  modelCaller?: ModelCaller;
}

export type SearchNewsResult =
  | { ok: true; items: PrepNewsItem[]; enabled: boolean; provider: string }
  | { ok: false; error: string; code: 'INVALID_INPUT' | 'PROVIDER_DISABLED' | 'PROVIDER_ERROR' };

export async function searchNews(
  query: string,
  options: SearchNewsOptions = {},
): Promise<SearchNewsResult> {
  const provider = options.provider ?? process.env.JOB_SEARCH_PROVIDER ?? 'none';
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { ok: false, code: 'INVALID_INPUT', error: 'Search query cannot be empty' };
  }

  if (trimmedQuery.length > 100) {
    return { ok: false, code: 'INVALID_INPUT', error: 'Search query exceeds maximum length of 100 characters' };
  }

  // Single provider selector check: must be claude_web and have an API key
  if (provider !== 'claude_web' || !apiKey) {
    // Fail-closed / clean unverified empty list with provider status
    return {
      ok: true,
      items: [],
      enabled: false,
      provider: provider === 'claude_web' && !apiKey ? 'unconfigured' : 'none',
    };
  }

  if (!options.modelCaller) {
    // In production, an actual web-search enabled caller would be invoked.
    // If no caller is provided, return fail-closed disabled status.
    return {
      ok: true,
      items: [],
      enabled: false,
      provider: 'claude_web',
    };
  }

  const system = `You are a corporate news search assistant for CareerForge. You retrieve recent public news headlines about a specified company or industry.
RULES:
1. ONLY return verified HTTPS URLs.
2. Provide objective summaries. Do not editorialize or fabricate news.
3. If no recent news is found, return an empty array.
4. Respond with JSON matching the schema.`;

  const userMessage = `Find recent public news for: "${trimmedQuery}".
Respond with JSON:
{
  "items": [
    {
      "title": "Headline",
      "source": "Publisher Name",
      "url": "https://example.com/article",
      "summary": "Short summary",
      "publishedAt": "YYYY-MM-DD" or null
    }
  ]
}`;

  const response = await options.modelCaller({ system, userMessage });
  if (!response.ok) {
    return { ok: false, code: 'PROVIDER_ERROR', error: response.error };
  }

  let parsed: unknown;
  try {
    const cleaned = response.content
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, code: 'PROVIDER_ERROR', error: 'Failed to parse JSON response from news provider' };
  }

  const validation = NewsModelOutputSchema.safeParse(parsed);
  if (!validation.success) {
    return {
      ok: false,
      code: 'PROVIDER_ERROR',
      error: `News provider output violated schema: ${validation.error.issues[0]?.message}`,
    };
  }

  const items: PrepNewsItem[] = validation.data.items.map(item => ({
    id: crypto.randomUUID(),
    title: item.title,
    source: item.source ?? 'Web',
    url: item.url,
    summary: item.summary,
    publishedAt: item.publishedAt,
    unverified: true,
  }));

  return { ok: true, items, enabled: true, provider: 'claude_web' };
}
