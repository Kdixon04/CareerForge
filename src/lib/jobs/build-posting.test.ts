import { describe, expect, it } from 'vitest';
import { parseJobInput, buildPreviewPosting } from './parse-job-input';
import { JobPostingSchema } from '../../contracts';

/** Valid draft input for preview building. */
const validInput = {
  title: 'Junior Web Developer',
  company: 'North Star Labs',
  description: 'Build accessible web interfaces with React and TypeScript.',
  location: 'Rexburg, ID',
  jobType: 'full_time' as const,
  workMode: 'on_site' as const,
  sourceUrl: 'https://example.com/jobs/001',
  deadline: '2026-12-01',
};

const testUserId = '11111111-1111-4111-8111-111111111111';

describe('buildPreviewPosting', () => {
  it('produces a valid JobPosting from a parsed draft', () => {
    const parseResult = parseJobInput(validInput);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const posting = buildPreviewPosting(parseResult.draft, testUserId);

    // Must pass the authoritative contract schema
    const contractResult = JobPostingSchema.safeParse(posting);
    expect(contractResult.success).toBe(true);
  });

  it('sets source to pasted and status to private', () => {
    const parseResult = parseJobInput(validInput);
    if (!parseResult.ok) return;

    const posting = buildPreviewPosting(parseResult.draft, testUserId);
    expect(posting.source).toBe('pasted');
    expect(posting.status).toBe('private');
    expect(posting.createdByUserId).toBe(testUserId);
    expect(posting.employerId).toBeNull();
    expect(posting.providerName).toBeNull();
    expect(posting.externalId).toBeNull();
    expect(posting.retrievedAt).toBeNull();
    expect(posting.deadlineVerified).toBe(false);
  });

  it('preserves all draft fields in the posting', () => {
    const parseResult = parseJobInput(validInput);
    if (!parseResult.ok) return;

    const posting = buildPreviewPosting(parseResult.draft, testUserId);
    expect(posting.title).toBe(validInput.title);
    expect(posting.company).toBe(validInput.company);
    expect(posting.description).toBe(validInput.description);
    expect(posting.location).toBe(validInput.location);
    expect(posting.jobType).toBe(validInput.jobType);
    expect(posting.workMode).toBe(validInput.workMode);
    expect(posting.sourceUrl).toBe(validInput.sourceUrl);
    expect(posting.deadline).toBe(validInput.deadline);
  });

  it('generates a valid UUID for the posting id', () => {
    const parseResult = parseJobInput(validInput);
    if (!parseResult.ok) return;

    const posting = buildPreviewPosting(parseResult.draft, testUserId);
    expect(posting.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('sets createdAt and updatedAt to valid ISO datetime strings', () => {
    const parseResult = parseJobInput(validInput);
    if (!parseResult.ok) return;

    const posting = buildPreviewPosting(parseResult.draft, testUserId);
    expect(() => new Date(posting.createdAt)).not.toThrow();
    expect(() => new Date(posting.updatedAt)).not.toThrow();
    expect(posting.createdAt).toBe(posting.updatedAt);
  });
});
