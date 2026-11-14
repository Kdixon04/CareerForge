import { describe, expect, it } from 'vitest';
import { JobPostingSchema } from './job';
import { exampleJob } from '../data/examples';

describe('job contract', () => {
  it('accepts an unverified private pasted job', () => {
    expect(JobPostingSchema.safeParse(exampleJob).success).toBe(true);
  });
  it('rejects invalid source URLs and verification values', () => {
    expect(JobPostingSchema.safeParse({ ...exampleJob, sourceUrl: 'javascript:bad' }).success).toBe(false);
    expect(JobPostingSchema.safeParse({ ...exampleJob, deadlineVerified: 'yes' }).success).toBe(false);
  });
});
