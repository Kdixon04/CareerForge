import { NextRequest } from 'next/server';
import { handlePrepNews } from '../../../../lib/claude/prep-handlers';

// ============================================================================
// ONE-LINE ENABLEMENT (single provider selector):
// Set JOB_SEARCH_PROVIDER=claude_web and ANTHROPIC_API_KEY
// ============================================================================
export async function GET(request: NextRequest): Promise<Response> {
  return handlePrepNews(request);
}
