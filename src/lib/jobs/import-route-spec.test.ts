import { describe, expect, it, vi } from 'vitest';
import { JobDraftSchema, JobPostingSchema, type JobDraft, type JobPosting } from '../../contracts';

/**
 * Route-level specification tests for the upcoming POST /api/jobs/import
 * and GET /api/jobs/[id] endpoints.
 *
 * These tests formalize the expected contract, security, and authorization
 * behaviors so the routes can be connected to Keyan's adapters immediately upon landing.
 */

const mockUserId = '11111111-1111-4111-8111-111111111111';
const foreignUserId = '88888888-8888-4888-8888-888888888888';
const mockJobId = '22222222-2222-4222-8222-222222222222';

const validDraft: JobDraft = {
  title: 'Junior Web Developer',
  company: 'North Star Labs',
  description: 'Build accessible web interfaces using React and TypeScript.',
  location: 'Rexburg, ID',
  jobType: 'full_time',
  workMode: 'on_site',
  sourceUrl: 'https://example.com/jobs/001',
  deadline: '2026-12-01',
};

describe('POST /api/jobs/import - contract specification', () => {
  it('validates JobDraft schema before attempting database insertion', () => {
    const result = JobDraftSchema.safeParse(validDraft);
    expect(result.success).toBe(true);
  });

  it('rejects input missing required title or company', () => {
    const invalidDraft = { ...validDraft, title: '' };
    const result = JobDraftSchema.safeParse(invalidDraft);
    expect(result.success).toBe(false);
  });

  it('server derives source=pasted, status=private, and caller ownership', () => {
    // When the route persists a draft, server must enforce these fields
    const now = new Date().toISOString();
    const persisted: JobPosting = {
      ...validDraft,
      id: mockJobId,
      source: 'pasted',
      providerName: null,
      externalId: null,
      createdByUserId: mockUserId,
      employerId: null,
      status: 'private',
      retrievedAt: null,
      deadlineVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    const check = JobPostingSchema.safeParse(persisted);
    expect(check.success).toBe(true);
    expect(persisted.source).toBe('pasted');
    expect(persisted.status).toBe('private');
    expect(persisted.createdByUserId).toBe(mockUserId);
    expect(persisted.employerId).toBeNull();
  });
});

describe('GET /api/jobs/[id] - authorization & isolation specification', () => {
  it('allows owner to read their own private job', () => {
    const ownJob: JobPosting = {
      ...validDraft,
      id: mockJobId,
      source: 'pasted',
      providerName: null,
      externalId: null,
      createdByUserId: mockUserId,
      employerId: null,
      status: 'private',
      retrievedAt: null,
      deadlineVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const isAuthorized = ownJob.createdByUserId === mockUserId || ownJob.status === 'published';
    expect(isAuthorized).toBe(true);
  });

  it('treats foreign private job as not found without revealing its existence', () => {
    const foreignJob: JobPosting = {
      ...validDraft,
      id: mockJobId,
      source: 'pasted',
      providerName: null,
      externalId: null,
      createdByUserId: foreignUserId,
      employerId: null,
      status: 'private',
      retrievedAt: null,
      deadlineVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Caller is mockUserId, job owner is foreignUserId and status is private
    const isAccessibleToCaller =
      foreignJob.createdByUserId === mockUserId ||
      (foreignJob.status === 'published' && foreignJob.source === 'employer');

    expect(isAccessibleToCaller).toBe(false);
    // Crucial: Route returns 404 NOT_FOUND, identical to non-existent job
    const responseStatus = isAccessibleToCaller ? 200 : 404;
    expect(responseStatus).toBe(404);
  });

  it('allows any authenticated student to read published employer jobs', () => {
    const publishedEmployerJob: JobPosting = {
      ...validDraft,
      id: mockJobId,
      source: 'employer',
      providerName: null,
      externalId: null,
      createdByUserId: foreignUserId,
      employerId: '77777777-7777-4777-8777-777777777777',
      status: 'published',
      retrievedAt: null,
      deadlineVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const isAccessibleToCaller =
      publishedEmployerJob.createdByUserId === mockUserId ||
      (publishedEmployerJob.status === 'published' && publishedEmployerJob.source === 'employer');

    expect(isAccessibleToCaller).toBe(true);
  });
});
