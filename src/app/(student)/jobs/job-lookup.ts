import type { JobPosting } from '../../../contracts';
import { exampleJob } from '../../../data/examples';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Fixture-only job lookup for the student jobs UI until Antigravity's authorized
 * GET /api/jobs/[id] and Keyan's adapters are available. Returns the fictional
 * example job when the id matches; otherwise null. Never invents a posting.
 */
export function findFixtureJob(id: string): JobPosting | null {
  if (!UUID_RE.test(id)) return null;
  return id === exampleJob.id ? exampleJob : null;
}
