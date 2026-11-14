import { NextRequest } from 'next/server';
import { handlePrepQuestions } from '../../../../lib/claude/prep-handlers';

// ============================================================================
// ONE-LINE ENABLEMENT (once Keyan lands src/lib/data/jobs.ts & facts adapter):
// Pass { getAuthorizedJob, getStudentFacts, modelCaller } to handlePrepQuestions
// ============================================================================
export async function POST(request: NextRequest): Promise<Response> {
  return handlePrepQuestions(request);
}
