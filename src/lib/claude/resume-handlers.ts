import { z } from 'zod';
import {
  ResumeVersionSchema,
  type ResumeVersion,
  type JobPosting,
  type StudentFact,
} from '../../contracts';
import { readBoundedBody, MAX_RAW_BODY_BYTES } from '../jobs/read-bounded-body';
import type { ModelCaller } from './resume-suggest';

/**
 * Interface for Keyan's upcoming user-scoped résumé adapters in `src/lib/data/`.
 *
 * Per AGENTS.md:
 * - `src/lib/data/**` is Keyan-owned; Dallas owns `src/app/api/resume/**` and `src/lib/claude/**`.
 * - Routes authenticate the caller, then delegate persistence under RLS.
 * - Generated payload / fact snapshot are immutable after insert; PATCH only updates editedBullets.
 */
export interface ResumeDataAdapter {
  getAuthorizedJob(id: string): Promise<JobPosting | null>;
  getStudentFacts(userId: string): Promise<StudentFact[]>;
  createResumeVersion(input: {
    jobId: string;
    generatedPayload: {
      generatedBullets: ResumeVersion['generatedBullets'];
      match: ResumeVersion['match'];
    };
    editedBullets: ResumeVersion['editedBullets'];
    factSnapshot: StudentFact[];
  }): Promise<ResumeVersion>;
  getOwnResumeVersion(id: string): Promise<ResumeVersion | null>;
  updateOwnResumeEditedBullets(
    id: string,
    editedBullets: ResumeVersion['editedBullets'],
  ): Promise<ResumeVersion | null>;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export type GetUserFn = () => Promise<AuthenticatedUser | null>;

export interface ResumeHandlerDependencies {
  getUser?: GetUserFn;
  adapter?: Partial<ResumeDataAdapter>;
  modelCaller?: ModelCaller;
  apiKey?: string;
}

const SuggestBodySchema = z.object({
  jobId: z.string().uuid(),
});

const PatchBodySchema = z.object({
  editedBullets: z
    .array(
      z.object({
        id: z.string().uuid(),
        text: z.string().max(2000),
      }),
    )
    .max(10),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function successResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requireUser(deps: ResumeHandlerDependencies): Promise<AuthenticatedUser | Response> {
  if (deps.getUser) {
    const user = await deps.getUser();
    if (!user) {
      return errorResponse(401, 'UNAUTHENTICATED', 'Authentication required');
    }
    return user;
  }

  try {
    const { createSupabaseServerClient } = await import('../supabase/server');
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse(401, 'UNAUTHENTICATED', 'Authentication required');
    }
    return { id: user.id, email: user.email ?? undefined };
  } catch {
    return errorResponse(401, 'UNAUTHENTICATED', 'Authentication required');
  }
}

/**
 * Handles `POST /api/resume/suggest`.
 *
 * Fail-closed while Keyan adapters / Anthropic wiring are absent: authenticated
 * callers with a valid `{ jobId }` receive 503 SERVICE_UNAVAILABLE — never a
 * fabricated ResumeVersion.
 */
export async function handleSuggestResume(
  request: Request,
  deps: ResumeHandlerDependencies = {},
): Promise<Response> {
  const auth = await requireUser(deps);
  if (auth instanceof Response) return auth;

  const bodyResult = await readBoundedBody(request, MAX_RAW_BODY_BYTES);
  if (!bodyResult.ok) {
    return errorResponse(bodyResult.status, bodyResult.code, bodyResult.message);
  }

  const rawText = bodyResult.text.trim();
  if (!rawText) {
    return errorResponse(400, 'INVALID_INPUT', 'Request body is empty');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return errorResponse(400, 'INVALID_INPUT', 'Request body must be valid JSON');
  }

  const body = SuggestBodySchema.safeParse(parsedJson);
  if (!body.success) {
    const firstIssue = body.error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join('.') || 'field'}: ${firstIssue.message}`
      : 'Invalid suggest request';
    return errorResponse(400, 'INVALID_INPUT', message);
  }

  const apiKey = deps.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !deps.modelCaller) {
    return errorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'Resume suggestion is not configured. Missing Anthropic API key.',
    );
  }

  const adapter = deps.adapter;
  if (
    !adapter?.getAuthorizedJob ||
    !adapter?.getStudentFacts ||
    !adapter?.createResumeVersion ||
    !deps.modelCaller
  ) {
    return errorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'Resume persistence adapter is not available. Waiting for Keyan data adapter.',
    );
  }

  // Live path reserved for Antigravity once Keyan adapters land; keep fail-closed.
  return errorResponse(
    503,
    'SERVICE_UNAVAILABLE',
    'Resume suggestion generation path is not wired yet.',
  );
}

/**
 * Handles `GET /api/resume/[id]`.
 *
 * Fail-closed without Keyan's getOwnResumeVersion adapter.
 */
export async function handleGetResume(
  id: string,
  deps: ResumeHandlerDependencies = {},
): Promise<Response> {
  const auth = await requireUser(deps);
  if (auth instanceof Response) return auth;

  if (!id || !UUID_REGEX.test(id)) {
    return errorResponse(404, 'NOT_FOUND', 'Resume version not found');
  }

  const getFn = deps.adapter?.getOwnResumeVersion;
  if (!getFn) {
    return errorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'Resume read adapter is not available. Waiting for Keyan data adapter.',
    );
  }

  try {
    const version = await getFn(id);
    if (!version) {
      return errorResponse(404, 'NOT_FOUND', 'Resume version not found');
    }

    const validated = ResumeVersionSchema.safeParse(version);
    if (!validated.success) {
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Server returned malformed resume data');
    }

    return successResponse(validated.data, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to load resume version';
    return errorResponse(503, 'SERVICE_UNAVAILABLE', message);
  }
}

/**
 * Handles `PATCH /api/resume/[id]`.
 *
 * Validates `{ editedBullets }` then fails closed without Keyan's update adapter.
 * Generated bullets / factSnapshot remain immutable through this endpoint.
 */
export async function handlePatchResume(
  id: string,
  request: Request,
  deps: ResumeHandlerDependencies = {},
): Promise<Response> {
  const auth = await requireUser(deps);
  if (auth instanceof Response) return auth;

  if (!id || !UUID_REGEX.test(id)) {
    return errorResponse(404, 'NOT_FOUND', 'Resume version not found');
  }

  const bodyResult = await readBoundedBody(request, MAX_RAW_BODY_BYTES);
  if (!bodyResult.ok) {
    return errorResponse(bodyResult.status, bodyResult.code, bodyResult.message);
  }

  const rawText = bodyResult.text.trim();
  if (!rawText) {
    return errorResponse(400, 'INVALID_INPUT', 'Request body is empty');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return errorResponse(400, 'INVALID_INPUT', 'Request body must be valid JSON');
  }

  const body = PatchBodySchema.safeParse(parsedJson);
  if (!body.success) {
    const firstIssue = body.error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join('.') || 'field'}: ${firstIssue.message}`
      : 'Invalid edited bullets';
    return errorResponse(400, 'INVALID_INPUT', message);
  }

  const updateFn = deps.adapter?.updateOwnResumeEditedBullets;
  if (!updateFn) {
    return errorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'Resume edit adapter is not available. Waiting for Keyan data adapter.',
    );
  }

  try {
    const updated = await updateFn(id, body.data.editedBullets);
    if (!updated) {
      return errorResponse(404, 'NOT_FOUND', 'Resume version not found');
    }

    const validated = ResumeVersionSchema.safeParse(updated);
    if (!validated.success) {
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Server returned malformed resume data');
    }

    return successResponse(validated.data, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to update resume version';
    return errorResponse(503, 'SERVICE_UNAVAILABLE', message);
  }
}
