import { describe, expect, it, vi } from 'vitest';
import {
  JOB_IMPORT_ROUTE,
  jobDraftFromPosting,
  requestGetJob,
  requestImportJob,
} from './job-api-client';
import type { JobPosting } from '../../../contracts';

const baseDraft = {
  title: 'Junior Web Developer',
  company: 'North Star Labs',
  description: 'Build accessible interfaces.',
  location: 'Rexburg, ID',
  jobType: 'full_time' as const,
  workMode: 'on_site' as const,
  sourceUrl: 'https://example.com/jobs/job-001',
  deadline: null,
};

const savedPosting: JobPosting = {
  ...baseDraft,
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  source: 'pasted',
  providerName: null,
  externalId: null,
  createdByUserId: '11111111-1111-4111-8111-111111111111',
  employerId: null,
  status: 'private',
  retrievedAt: null,
  deadlineVerified: false,
  createdAt: '2026-11-14T12:00:00.000Z',
  updatedAt: '2026-11-14T12:00:00.000Z',
};


describe('requestImportJob (mocked)', () => {
  it('returns validated JobPosting on 200', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: savedPosting }),
    });
    const result = await requestImportJob(baseDraft, fetch);
    expect(result).toEqual({ ok: true, posting: savedPosting });
    expect(fetch).toHaveBeenCalledWith(JOB_IMPORT_ROUTE, expect.objectContaining({ method: 'POST' }));
  });

  it('maps 400, 401, 403, and 503 errors', async () => {
    for (const status of [400, 401, 403, 503] as const) {
      const fetch = vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ error: { code: 'X', message: `Err ${status}` } }),
      });
      const result = await requestImportJob(baseDraft, fetch);
      expect(result).toEqual({ ok: false, status, message: `Err ${status}` });
    }
  });

  it('returns network on thrown fetch', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await requestImportJob(baseDraft, fetch)).toEqual({ ok: false, status: 'network' });
  });

  it('returns 503 when response data fails JobPostingSchema', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { title: 'incomplete' } }),
    });
    const result = await requestImportJob(baseDraft, fetch);
    expect(result).toEqual({ ok: false, status: 503, message: 'Server returned malformed job data' });
  });
});

describe('requestGetJob (mocked)', () => {
  it('returns posting on 200', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: savedPosting }),
    });
    const result = await requestGetJob(savedPosting.id, fetch);
    expect(result).toEqual({ ok: true, posting: savedPosting });
  });

  it('maps 404 for inaccessible job', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: 'NOT_FOUND', message: 'Job not found' } }),
    });
    expect(await requestGetJob(savedPosting.id, fetch)).toEqual({
      ok: false,
      status: 404,
      message: 'Job not found',
    });
  });
});

describe('jobDraftFromPosting', () => {
  it('strips server-controlled fields for import body', () => {
    expect(jobDraftFromPosting(savedPosting)).toEqual(baseDraft);
  });
});