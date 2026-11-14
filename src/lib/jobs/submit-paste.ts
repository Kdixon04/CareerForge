import { z } from 'zod';
import { JobPostingSchema, JobDraftSchema, type JobPosting } from '../../contracts';
import {
  type PasteJobInput,
  type PasteJobFieldErrors,
} from '../../app/(student)/jobs/paste-job';

export const MAX_DESCRIPTION_LENGTH = 20_000;

export const PARSE_JOB_ROUTE = '/api/jobs/parse';

/**
 * Flag indicating whether PR #18 (POST /api/jobs/parse) has been merged into main.
 *
 * The server parse route is now merged into main, so production calls use the
 * authenticated route. Tests can still supply a custom fetch implementation.
 */
export const IS_PARSE_ROUTE_MERGED = true;

export type SubmitPasteResult =
  | { ok: true; posting: JobPosting }
  | { ok: false; errors: PasteJobFieldErrors; message?: string };

function friendlyMessage(issue: z.ZodIssue): string {
  const field = issue.path[0];
  if (field === 'sourceUrl') return 'Enter a full https:// URL, or leave it blank.';
  if (field === 'deadline') return 'Use the date format YYYY-MM-DD, or leave it blank.';
  if (field === 'description' && issue.code === 'too_big') {
    return 'Description is too long (20,000 characters maximum).';
  }
  return 'This field is required.';
}

/**
 * Submits a pasted job description to the server for parsing and validation,
 * returning a validated JobPosting object or structured errors.
 *
 * Production calls POST to `/api/jobs/parse` and verify the returned
 * `JobPosting`. Tests may provide `customFetch` to exercise the response path.
 * The route currently returns a validated, non-persisted preview; persistence is
 * added by the authenticated data adapter integration.
 */
export async function submitPasteJob(
  input: PasteJobInput,
  customFetch?: typeof fetch,
): Promise<SubmitPasteResult> {
  // 1. Critical pre-fetch limit: reject oversized description before network call
  if (input.description && input.description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      errors: {
        description: `Description is too long (${MAX_DESCRIPTION_LENGTH.toLocaleString()} characters maximum).`,
      },
    };
  }

  // 2. Real server call (used in tests with mock fetch, and in prod once PR #18 merges)
  if (customFetch || IS_PARSE_ROUTE_MERGED) {
    const fetcher = customFetch ?? globalThis.fetch;
    try {
      const response = await fetcher(PARSE_JOB_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.title.trim(),
          company: input.company.trim(),
          description: input.description.trim(),
          location: input.location.trim() || null,
          jobType: input.jobType,
          workMode: input.workMode,
          sourceUrl: input.sourceUrl.trim() || null,
          deadline: input.deadline.trim() || null,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const validated = JobPostingSchema.safeParse(json.data);
        if (validated.success) {
          return { ok: true, posting: validated.data };
        }
        return { ok: false, errors: {}, message: 'Server returned malformed job data' };
      }

      // Handle 400 or other HTTP errors gracefully
      const errorJson = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      const errorMessage = errorJson?.error?.message ?? 'Server rejected job input';

      const errors: PasteJobFieldErrors = {};
      const lower = errorMessage.toLowerCase();
      if (lower.includes('title')) errors.title = errorMessage;
      else if (lower.includes('company')) errors.company = errorMessage;
      else if (lower.includes('description')) errors.description = errorMessage;
      else if (lower.includes('source url') || lower.includes('url')) errors.sourceUrl = 'Enter a full https:// URL, or leave it blank.';
      else if (lower.includes('deadline')) errors.deadline = 'Use the date format YYYY-MM-DD, or leave it blank.';

      return { ok: false, errors, message: errorMessage };
    } catch {
      return { ok: false, errors: {}, message: 'Unable to reach job parse service' };
    }
  }

  // 3. Fixture-shape builder while PR #18 is pending merge to main
  const candidate = {
    title: input.title.trim(),
    company: input.company.trim(),
    description: input.description.trim(),
    location: input.location.trim() || null,
    jobType: input.jobType,
    workMode: input.workMode,
    sourceUrl: input.sourceUrl.trim() || null,
    deadline: input.deadline.trim() || null,
  };

  const parsed = JobDraftSchema.safeParse(candidate);
  if (!parsed.success) {
    const errors: PasteJobFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof PasteJobInput | undefined;
      if (key && !errors[key]) errors[key] = friendlyMessage(issue);
    }
    return { ok: false, errors };
  }

  const now = new Date().toISOString();
  const fixturePosting: JobPosting = {
    ...parsed.data,
    id: '22222222-2222-4222-8222-222222222222',
    source: 'pasted',
    providerName: null,
    externalId: null,
    createdByUserId: '11111111-1111-4111-8111-111111111111',
    employerId: null,
    status: 'private',
    retrievedAt: null,
    deadlineVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  return { ok: true, posting: fixturePosting };
}
