import { NextRequest } from 'next/server';
import { handleGetJob } from '../../../../lib/jobs/private-job-handlers';

// ============================================================================
// ONE-LINE ENABLEMENT (once Keyan lands src/lib/data/jobs.ts):
// 1. Uncomment: import { getAuthorizedJob } from '../../../../lib/data/jobs';
// 2. Change the return line to:
//    return handleGetJob(id, { adapter: { getAuthorizedJob } });
// ============================================================================

/**
 * GET /api/jobs/[id]
 *
 * Authenticated authorized job read route (own private pasted job or published employer job).
 *
 * Current status: INERT / FAIL-CLOSED.
 * Keyan's user-scoped adapter in `src/lib/data/jobs.ts` is pending.
 * While that adapter is absent, this route fails closed and returns 503 SERVICE_UNAVAILABLE
 * with no claim of persistence.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return handleGetJob(id);
}
