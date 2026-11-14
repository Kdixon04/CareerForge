import { describe, expect, it } from 'vitest';
import { parseJobInput, MAX_DESCRIPTION_LENGTH, ParseJobRequestSchema } from './parse-job-input';
import { JobDraftSchema, JobPostingSchema } from '../../contracts';

/** Minimal valid pasted job input. */
const validInput = {
  title: 'Junior Web Developer',
  company: 'North Star Labs',
  description: 'Build accessible web interfaces with React and TypeScript.',
  location: 'Rexburg, ID',
  jobType: 'full_time',
  workMode: 'on_site',
  sourceUrl: 'https://example.com/jobs/001',
  deadline: '2026-12-01',
};

describe('parseJobInput', () => {
  // --- Valid inputs ---

  it('accepts a valid pasted job and returns a JobDraft', () => {
    const result = parseJobInput(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.title).toBe('Junior Web Developer');
      expect(result.draft.company).toBe('North Star Labs');
      expect(result.draft.description).toBe('Build accessible web interfaces with React and TypeScript.');
      expect(result.draft.location).toBe('Rexburg, ID');
      expect(result.draft.jobType).toBe('full_time');
      expect(result.draft.workMode).toBe('on_site');
      expect(result.draft.sourceUrl).toBe('https://example.com/jobs/001');
      expect(result.draft.deadline).toBe('2026-12-01');
    }
  });

  it('trims whitespace from string fields', () => {
    const result = parseJobInput({
      ...validInput,
      title: '  Junior Web Developer  ',
      company: '  North Star Labs  ',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.title).toBe('Junior Web Developer');
      expect(result.draft.company).toBe('North Star Labs');
    }
  });

  it('normalizes empty optional strings to null', () => {
    const result = parseJobInput({
      ...validInput,
      location: '',
      sourceUrl: '',
      deadline: '',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.location).toBeNull();
      expect(result.draft.sourceUrl).toBeNull();
      expect(result.draft.deadline).toBeNull();
    }
  });

  it('normalizes whitespace-only optional strings to null', () => {
    const result = parseJobInput({
      ...validInput,
      location: '   ',
      sourceUrl: '   ',
      deadline: '   ',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.location).toBeNull();
      expect(result.draft.sourceUrl).toBeNull();
      expect(result.draft.deadline).toBeNull();
    }
  });

  it('defaults jobType and workMode to unknown when omitted', () => {
    const { jobType, workMode, ...rest } = validInput;
    const result = parseJobInput(rest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.jobType).toBe('unknown');
      expect(result.draft.workMode).toBe('unknown');
    }
  });

  // --- Invalid inputs: malformed body ---

  it('rejects null body', () => {
    const result = parseJobInput(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(400);
      expect(result.error.code).toBe('INVALID_INPUT');
    }
  });

  it('rejects array body', () => {
    const result = parseJobInput([validInput]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(400);
    }
  });

  it('rejects non-object primitives', () => {
    expect(parseJobInput('string').ok).toBe(false);
    expect(parseJobInput(42).ok).toBe(false);
    expect(parseJobInput(true).ok).toBe(false);
  });

  // --- Invalid inputs: missing required fields ---

  it('rejects missing title', () => {
    const { title, ...rest } = validInput;
    const result = parseJobInput(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(400);
      expect(result.error.message).toContain('title');
    }
  });

  it('rejects empty title', () => {
    const result = parseJobInput({ ...validInput, title: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(400);
  });

  it('rejects missing company', () => {
    const { company, ...rest } = validInput;
    const result = parseJobInput(rest);
    expect(result.ok).toBe(false);
  });

  it('rejects missing description', () => {
    const { description, ...rest } = validInput;
    const result = parseJobInput(rest);
    expect(result.ok).toBe(false);
  });

  // --- Invalid inputs: size limits ---

  it('rejects description over 20,000 characters', () => {
    const result = parseJobInput({
      ...validInput,
      description: 'x'.repeat(MAX_DESCRIPTION_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(400);
      expect(result.error.message).toContain('description');
    }
  });

  it('accepts description at exactly 20,000 characters', () => {
    const result = parseJobInput({
      ...validInput,
      description: 'x'.repeat(MAX_DESCRIPTION_LENGTH),
    });
    expect(result.ok).toBe(true);
  });

  it('rejects excessively long title', () => {
    const result = parseJobInput({ ...validInput, title: 'x'.repeat(201) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(400);
  });

  // --- Invalid inputs: format validation ---

  it('rejects non-HTTPS source URL', () => {
    const result = parseJobInput({ ...validInput, sourceUrl: 'http://example.com/job' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(400);
  });

  it('rejects invalid source URL format', () => {
    const result = parseJobInput({ ...validInput, sourceUrl: 'not-a-url' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(400);
  });

  it('rejects javascript: URL', () => {
    const result = parseJobInput({ ...validInput, sourceUrl: 'javascript:alert(1)' });
    expect(result.ok).toBe(false);
  });

  it('rejects malformed deadline format', () => {
    const result = parseJobInput({ ...validInput, deadline: '12/01/2026' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(400);
  });

  it('accepts valid YYYY-MM-DD deadline', () => {
    const result = parseJobInput({ ...validInput, deadline: '2026-12-01' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.draft.deadline).toBe('2026-12-01');
  });

  it('rejects invalid jobType enum value', () => {
    const result = parseJobInput({ ...validInput, jobType: 'freelance' });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid workMode enum value', () => {
    const result = parseJobInput({ ...validInput, workMode: 'telecommute' });
    expect(result.ok).toBe(false);
  });

  // --- Output contract compliance ---

  it('produces a draft that validates against the authoritative JobDraftSchema', () => {
    const result = parseJobInput(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const contractResult = JobDraftSchema.safeParse(result.draft);
      expect(contractResult.success).toBe(true);
    }
  });
});
