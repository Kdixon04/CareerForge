import { describe, expect, it } from 'vitest';
import { parseJobDraft, type PasteJobInput } from './paste-job';

const base: PasteJobInput = {
  title: 'Junior Web Developer',
  company: 'North Star Labs',
  description: 'Build accessible web interfaces.',
  location: 'Rexburg, ID',
  jobType: 'full_time',
  workMode: 'on_site',
  sourceUrl: 'https://example.com/jobs/job-001',
  deadline: '',
};

describe('parseJobDraft', () => {
  it('accepts a valid pasted job and normalizes blank optional fields to null', () => {
    const result = parseJobDraft({ ...base, location: '   ', sourceUrl: '', deadline: '' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.title).toBe('Junior Web Developer');
      expect(result.draft.location).toBeNull();
      expect(result.draft.sourceUrl).toBeNull();
      expect(result.draft.deadline).toBeNull();
    }
  });

  it('trims surrounding whitespace on required text', () => {
    const result = parseJobDraft({ ...base, title: '  Junior Web Developer  ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.draft.title).toBe('Junior Web Developer');
  });

  it('flags each required field that is blank', () => {
    const result = parseJobDraft({ ...base, title: '   ', company: '', description: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeTruthy();
      expect(result.errors.company).toBeTruthy();
      expect(result.errors.description).toBeTruthy();
    }
  });

  it('rejects a non-https source URL', () => {
    const result = parseJobDraft({ ...base, sourceUrl: 'http://example.com/jobs/job-001' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.sourceUrl).toBeTruthy();
  });

  it('rejects an over-long description', () => {
    const result = parseJobDraft({ ...base, description: 'x'.repeat(20_001) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.description).toBeTruthy();
  });

  it('rejects a malformed deadline but accepts YYYY-MM-DD', () => {
    expect(parseJobDraft({ ...base, deadline: '12/01/2026' }).ok).toBe(false);
    expect(parseJobDraft({ ...base, deadline: '2026-12-01' }).ok).toBe(true);
  });
});
