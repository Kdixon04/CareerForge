import { z } from 'zod';
import { JobDraftSchema, type JobDraft, type JobPosting } from '../../contracts';

/**
 * Maximum characters allowed in a raw pasted job description.
 * AGENTS.md specifies 20,000; the contract schema enforces the same limit.
 */
export const MAX_DESCRIPTION_LENGTH = 20_000;

/**
 * Server-side request schema for POST /api/jobs/parse.
 *
 * Accepts a raw pasted job description string. All external content is
 * treated as untrusted data.
 */
export const ParseJobRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  company: z.string().min(1, 'Company is required').max(200, 'Company is too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(MAX_DESCRIPTION_LENGTH, `Description exceeds ${MAX_DESCRIPTION_LENGTH} characters`),
  location: z.string().max(200).nullable().default(null),
  jobType: z
    .enum(['internship', 'full_time', 'part_time', 'co_op', 'contract', 'unknown'])
    .default('unknown'),
  workMode: z.enum(['remote', 'hybrid', 'on_site', 'unknown']).default('unknown'),
  sourceUrl: z
    .string()
    .url('Source URL must be a valid URL')
    .regex(/^https:\/\//, 'Source URL must use HTTPS')
    .nullable()
    .default(null),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD')
    .nullable()
    .default(null),
});

export type ParseJobRequest = z.infer<typeof ParseJobRequestSchema>;

/**
 * Normalize raw string inputs from the client: trim whitespace and convert
 * empty strings to null for nullable fields.
 */
function normalizeInput(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Nullable fields: convert empty strings to null
      if (['location', 'sourceUrl', 'deadline'].includes(key)) {
        normalized[key] = trimmed || null;
      } else {
        normalized[key] = trimmed;
      }
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

/**
 * Parse and validate a pasted job input. Returns a validated JobDraft on
 * success, or a structured error on failure.
 */
export function parseJobInput(
  raw: unknown,
): { ok: true; draft: JobDraft } | { ok: false; code: number; error: { code: string; message: string } } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      code: 400,
      error: { code: 'INVALID_INPUT', message: 'Request body must be a JSON object' },
    };
  }

  const normalized = normalizeInput(raw as Record<string, unknown>);
  const requestResult = ParseJobRequestSchema.safeParse(normalized);

  if (!requestResult.success) {
    const firstIssue = requestResult.error.issues[0];
    return {
      ok: false,
      code: 400,
      error: {
        code: 'INVALID_INPUT',
        message: firstIssue
          ? `${String(firstIssue.path[0] ?? 'input')}: ${firstIssue.message}`
          : 'Invalid input',
      },
    };
  }

  // Double-validate against the authoritative contract schema
  const draftResult = JobDraftSchema.safeParse(requestResult.data);
  if (!draftResult.success) {
    return {
      ok: false,
      code: 400,
      error: { code: 'INVALID_INPUT', message: 'Input does not match job schema' },
    };
  }

  return { ok: true, draft: draftResult.data };
}

/**
 * Build a preview JobPosting from a validated JobDraft.
 *
 * This creates a local, unsaved preview with deterministic IDs for testing.
 * Real persistence through Keyan's adapters will replace the UUID generation.
 */
export function buildPreviewPosting(draft: JobDraft, userId: string): JobPosting {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: crypto.randomUUID(),
    source: 'pasted' as const,
    providerName: null,
    externalId: null,
    createdByUserId: userId,
    employerId: null,
    status: 'private' as const,
    retrievedAt: null,
    deadlineVerified: false,
    createdAt: now,
    updatedAt: now,
  };
}
