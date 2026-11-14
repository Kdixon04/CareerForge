import { describe, expect, it, vi } from 'vitest';
import { submitPasteJob, MAX_DESCRIPTION_LENGTH, PARSE_JOB_ROUTE } from './submit-paste';
import { JobPostingSchema, type JobPosting } from '../../contracts';
import { type PasteJobInput } from '../../app/(student)/jobs/paste-job';

const validBaseInput: PasteJobInput = {
  title: 'Junior Web Developer',
  company: 'North Star Labs',
  description: 'Build accessible web interfaces.',
  location: 'Rexburg, ID',
  jobType: 'full_time',
  workMode: 'on_site',
  sourceUrl: 'https://example.com/jobs/job-001',
  deadline: '2026-12-01',
};

const mockServerPosting: JobPosting = {
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Junior Web Developer',
  company: 'North Star Labs',
  description: 'Build accessible web interfaces.',
  location: 'Rexburg, ID',
  jobType: 'full_time',
  workMode: 'on_site',
  sourceUrl: 'https://example.com/jobs/job-001',
  deadline: '2026-12-01',
  source: 'pasted',
  providerName: null,
  externalId: null,
  createdByUserId: '11111111-1111-4111-8111-111111111111',
  employerId: null,
  status: 'private',
  retrievedAt: null,
  deadlineVerified: false,
  createdAt: '2026-11-14T02:00:00.000Z',
  updatedAt: '2026-11-14T02:00:00.000Z',
};

describe('submitPasteJob', () => {
  it('rejects oversized text (> 20,000 chars) before calling fetch', async () => {
    const fetchMock = vi.fn();
    const oversizedInput: PasteJobInput = {
      ...validBaseInput,
      description: 'x'.repeat(MAX_DESCRIPTION_LENGTH + 1),
    };

    const result = await submitPasteJob(oversizedInput, fetchMock as unknown as typeof fetch);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.description).toContain('20,000 characters maximum');
    }
    // Critical requirement: fetch is never called when input is oversized
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submitting valid text calls POST /api/jobs/parse and returns a JobPosting shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockServerPosting }),
    });

    const result = await submitPasteJob(validBaseInput, fetchMock as unknown as typeof fetch);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(PARSE_JOB_ROUTE);
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(calledOptions.body)).toMatchObject({
      title: 'Junior Web Developer',
      company: 'North Star Labs',
      description: 'Build accessible web interfaces.',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.posting.id).toBe(mockServerPosting.id);
      expect(result.posting.source).toBe('pasted');
      expect(result.posting.status).toBe('private');
      // Validate returned object conforms to authoritative contract schema
      const contractCheck = JobPostingSchema.safeParse(result.posting);
      expect(contractCheck.success).toBe(true);
    }
  });

  it('server returns 400 -> returns typed error without crashing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 'INVALID_INPUT', message: 'Enter a full https:// URL, or leave it blank.' },
      }),
    });

    const badInput: PasteJobInput = {
      ...validBaseInput,
      sourceUrl: 'http://insecure.example.com',
    };

    const result = await submitPasteJob(badInput, fetchMock as unknown as typeof fetch);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('Enter a full https:// URL, or leave it blank.');
      expect(result.errors.sourceUrl).toBe('Enter a full https:// URL, or leave it blank.');
    }
  });

  it('builds against fixture JobPosting shape when no custom fetch is provided while route is pending', async () => {
    const result = await submitPasteJob(validBaseInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.posting.title).toBe('Junior Web Developer');
      expect(result.posting.company).toBe('North Star Labs');
      expect(result.posting.source).toBe('pasted');
      expect(result.posting.status).toBe('private');
      expect(result.posting.deadlineVerified).toBe(false);

      const contractCheck = JobPostingSchema.safeParse(result.posting);
      expect(contractCheck.success).toBe(true);
    }
  });

  it('validates required fields in fixture mode', async () => {
    const emptyInput: PasteJobInput = {
      title: '',
      company: '',
      description: '',
      location: '',
      jobType: 'unknown',
      workMode: 'unknown',
      sourceUrl: '',
      deadline: '',
    };

    const result = await submitPasteJob(emptyInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeTruthy();
      expect(result.errors.company).toBeTruthy();
      expect(result.errors.description).toBeTruthy();
    }
  });
});
