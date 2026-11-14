import { NextRequest } from 'next/server';
import { handleSuggestResume } from '../../../../lib/claude/resume-handlers';

// ============================================================================
// ONE-LINE ENABLEMENT (once Keyan lands src/lib/data + Claude wiring):
// Pass { adapter: { getAuthorizedJob, getStudentFacts, createResumeVersion }, modelCaller }
// into handleSuggestResume after confirming ANTHROPIC_API_KEY in the deployed env.
// ============================================================================

/**
 * POST /api/resume/suggest
 *
 * Authenticated résumé suggestion route.
 *
 * Current status: INERT / FAIL-CLOSED.
 * Keyan's user-scoped adapters in `src/lib/data/**` are pending and Claude
 * generation is not wired through this HTTP path yet. Returns 503
 * SERVICE_UNAVAILABLE with no fabricated ResumeVersion.
 */
export async function POST(request: NextRequest): Promise<Response> {
  return handleSuggestResume(request);
}
