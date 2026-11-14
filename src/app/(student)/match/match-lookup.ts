import type { JobPosting, ResumeVersion } from '../../../contracts';
import { exampleJob, exampleResumeSuggestion } from '../../../data/examples';
import { findFixtureJob } from '../jobs/job-lookup';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type FixtureMatchBundle = {
  job: JobPosting;
  resume: ResumeVersion;
};

/**
 * Fixture-only match lookup keyed by job id until Antigravity's suggest/read routes exist.
 */
export function findFixtureMatch(jobId: string): FixtureMatchBundle | null {
  if (!UUID_RE.test(jobId)) return null;
  if (jobId !== exampleResumeSuggestion.jobId) return null;
  const job = findFixtureJob(jobId);
  if (!job) return null;
  if (job.id !== exampleJob.id) return null;
  return { job, resume: exampleResumeSuggestion };
}