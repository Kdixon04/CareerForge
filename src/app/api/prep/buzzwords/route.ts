import { NextRequest } from 'next/server';
import { handlePrepBuzzwords } from '../../../../lib/claude/prep-handlers';

// ============================================================================
// ONE-LINE ENABLEMENT (once Keyan lands src/lib/data/jobs.ts):
// Pass { getAuthorizedJob, modelCaller } to handlePrepBuzzwords
// ============================================================================
export async function POST(request: NextRequest): Promise<Response> {
  return handlePrepBuzzwords(request);
}
