import { NextRequest } from 'next/server';
import { handleImportJob } from '../../../../lib/jobs/private-job-handlers';

// ============================================================================
// ONE-LINE ENABLEMENT (once Keyan lands src/lib/data/jobs.ts):
// 1. Uncomment: import { createPrivateJobImport } from '../../../../lib/data/jobs';
// 2. Change the return line to:
//    return handleImportJob(request, { adapter: { createPrivateJobImport } });
// ============================================================================

/**
 * POST /api/jobs/import
 *
 * Authenticated private pasted-job import route.
 *
 * Current status: INERT / FAIL-CLOSED.
 * Keyan's user-scoped adapter in `src/lib/data/jobs.ts` is pending.
 * While that adapter is absent, this route fails closed and returns 503 SERVICE_UNAVAILABLE
 * with no claim of persistence.
 */
export async function POST(request: NextRequest): Promise<Response> {
  return handleImportJob(request);
}
