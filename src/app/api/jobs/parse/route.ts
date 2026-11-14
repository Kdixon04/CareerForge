import { NextRequest, NextResponse } from 'next/server';
import { parseJobInput, buildPreviewPosting } from '../../../../lib/jobs/parse-job-input';
import { readBoundedBody, MAX_RAW_BODY_BYTES } from '../../../../lib/jobs/read-bounded-body';
import { JobPostingSchema } from '../../../../contracts';

/**
 * POST /api/jobs/parse
 *
 * Validates a pasted job description and returns a JobPosting-shaped preview.
 * This is a stateless parse/validate endpoint — it does not persist anything.
 *
 * The caller sends a JSON body with job fields (title, company, description,
 * etc.) and receives either a validated JobPosting preview, a 400 error,
 * or a 413 error if the raw payload exceeds the hard byte limit.
 *
 * All external content is treated as untrusted data. Raw request bodies are
 * bounded before JSON parsing or schema validation. No descriptions or
 * personal data are ever logged — only request IDs, status codes, and byte counts.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  // 1. Bound raw request body before JSON parsing or Zod schema validation
  const bodyResult = await readBoundedBody(request, MAX_RAW_BODY_BYTES);
  if (!bodyResult.ok) {
    console.info(`[parse] id=${requestId} status=${bodyResult.status} reason=${bodyResult.code}`);
    return NextResponse.json(
      { error: { code: bodyResult.code, message: bodyResult.message } },
      { status: bodyResult.status },
    );
  }

  const text = bodyResult.text;
  if (!text.trim()) {
    console.info(`[parse] id=${requestId} status=400 reason=empty_body`);
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Request body is empty' } },
      { status: 400 },
    );
  }

  // 2. Safe JSON parsing of bounded text
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    console.info(`[parse] id=${requestId} status=400 reason=invalid_json`);
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Request body must be valid JSON' } },
      { status: 400 },
    );
  }

  // 3. Schema validation and business logic
  const result = parseJobInput(body);
  if (!result.ok) {
    console.info(`[parse] id=${requestId} status=${result.code} reason=validation_failed`);
    return NextResponse.json({ error: result.error }, { status: result.code });
  }

  // 4. Build preview posting
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

  console.info(`[parse] id=${requestId} status=200 bytes=${bodyResult.bytesRead}`);
  return NextResponse.json({ data: contractResult.data });
}
