import { NextRequest } from 'next/server';
import { handleGetResume, handlePatchResume } from '../../../../lib/claude/resume-handlers';

// ============================================================================
// ONE-LINE ENABLEMENT (once Keyan lands src/lib/data/resume.ts or jobs.ts):
// 1. Uncomment adapters: getOwnResumeVersion / updateOwnResumeEditedBullets
// 2. Pass { adapter: { getOwnResumeVersion } } to handleGetResume
// 3. Pass { adapter: { updateOwnResumeEditedBullets } } to handlePatchResume
// ============================================================================

/**
 * GET /api/resume/[id]
 *
 * Authenticated own ResumeVersion read.
 *
 * Current status: INERT / FAIL-CLOSED without Keyan adapter.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return handleGetResume(id);
}

/**
 * PATCH /api/resume/[id]
 *
 * Authenticated own editedBullets update. Generated payload / factSnapshot
 * remain immutable through this endpoint.
 *
 * Current status: INERT / FAIL-CLOSED without Keyan adapter.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return handlePatchResume(id, request);
}
