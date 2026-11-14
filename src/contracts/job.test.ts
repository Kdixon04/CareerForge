import { describe, expect, it } from 'vitest';
import { JobSchema } from './job';

describe('Job contract', () => {
  it('requires a source URL and verification status', () => {
    const result = JobSchema.safeParse({
      id: 'job-001', title: 'Junior Web Developer', company: 'North Star Labs',
      location: 'Rexburg, ID', sourceUrl: 'https://example.com/jobs/job-001',
      verificationStatus: 'unverified',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unsupported verification statuses', () => {
    expect(JobSchema.safeParse({
      id: 'job-001', title: 'Junior Web Developer', company: 'North Star Labs',
      location: 'Rexburg, ID', sourceUrl: 'https://example.com/jobs/job-001', verificationStatus: 'maybe',
    }).success).toBe(false);
  });
});
