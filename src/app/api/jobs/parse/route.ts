import { NextRequest, NextResponse } from 'next/server';
import { parseJobInput, buildPreviewPosting } from '../../../../lib/jobs/parse-job-input';
import { JobPostingSchema } from '../../../../contracts';

/**
 * POST /api/jobs/parse
 *
 * Validates a pasted job description and returns a JobPosting-shaped preview.
 * This is a stateless parse/validate endpoint — it does not persist anything.
 *
 * The caller sends a JSON body with job fields (title, company, description,
 * etc.) and receives either a validated JobPosting preview or a 400 error.
 *
 * All external content is treated as untrusted data. No full descriptions or
 * personal data are logged — only request IDs and status codes.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  let body: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) {
      console.info(`[parse] id=${requestId} status=400 reason=empty_body`);
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Request body is empty' } },
        { status: 400 },
      );
    }
    body = JSON.parse(text);
  } catch {
    console.info(`[parse] id=${requestId} status=400 reason=invalid_json`);
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Request body must be valid JSON' } },
      { status: 400 },
    );
  }

  const result = parseJobInput(body);
  if (!result.ok) {
    console.info(`[parse] id=${requestId} status=${result.code} reason=validation_failed`);
    return NextResponse.json({ error: result.error }, { status: result.code });
  }

  // Build a preview posting. In the future this will be an authenticated
  // import through Keyan's adapters; for now we use a placeholder user ID.
  // The preview is not persisted.
  const previewUserId = '00000000-0000-4000-8000-000000000000';
  const posting = buildPreviewPosting(result.draft, previewUserId);

  // Final validation against the authoritative contract schema
  const contractResult = JobPostingSchema.safeParse(posting);
  if (!contractResult.success) {
    // This should never happen in practice — it means our builder is wrong
    console.error(`[parse] id=${requestId} status=500 reason=contract_violation`);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }

  console.info(`[parse] id=${requestId} status=200`);
  return NextResponse.json({ data: contractResult.data });
}
