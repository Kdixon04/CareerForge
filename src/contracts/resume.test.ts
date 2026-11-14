import { describe, expect, it } from 'vitest';
import { ResumeSuggestionSchema } from './resume';

describe('Resume suggestion contract', () => {
  it('links every suggestion to a source fact', () => {
    const result = ResumeSuggestionSchema.safeParse({
      id: 'suggestion-001', type: 'skill', text: 'Built a typed job tracker with TypeScript.',
      sourceFactIds: ['skill-typescript'], evidence: 'TypeScript',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sourceFactIds).toContain('skill-typescript');
  });

  it('requires at least one source fact', () => {
    expect(ResumeSuggestionSchema.safeParse({
      id: 'suggestion-001', type: 'skill', text: 'A claim', sourceFactIds: [], evidence: 'A fact',
    }).success).toBe(false);
  });
});
