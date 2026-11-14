import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readBoundedBody, MAX_RAW_BODY_BYTES } from '../jobs/read-bounded-body';
import { generatePrepQuestions, type PrepQuestion } from './prep-questions';
import { generatePrepBuzzwords, type PrepBuzzword } from './prep-buzzwords';
import { searchNews, type SearchNewsOptions, type SearchNewsResult } from './prep-news';
import type { JobPosting, StudentFact } from '../../contracts';
import type { ModelCaller } from './resume-suggest';

// ============================================================================
// 1. Prep Questions Handler & Types
// ============================================================================

const PrepQuestionsRequestSchema = z.object({
  jobId: z.string().uuid(),
  consent: z.literal(true, {
    message: 'Explicit student consent is required to process profile facts for interview preparation',
  }),
});

export interface PrepQuestionsRouteDeps {
  getUser?: () => Promise<{ id: string } | null>;
  getAuthorizedJob?: (id: string) => Promise<JobPosting | null>;
  getStudentFacts?: (userId: string) => Promise<StudentFact[]>;
  modelCaller?: ModelCaller;
  apiKey?: string;
}

export async function handlePrepQuestions(
  request: Request,
  deps: PrepQuestionsRouteDeps = {},
): Promise<Response> {
  // 1. Authenticate caller session
  let userId: string;
  if (deps.getUser) {
    const user = await deps.getUser();
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
    }
    userId = user.id;
  } else {
    try {
      const { createSupabaseServerClient } = await import('../supabase/server');
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
      }
      userId = user.id;
    } catch {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
    }
  }

  // 2. Read bounded request body
  const bodyResult = await readBoundedBody(request, MAX_RAW_BODY_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: { code: bodyResult.code, message: bodyResult.message } }, { status: bodyResult.status });
  }

  if (!bodyResult.text.trim()) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Request body is empty' } }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Request body must be valid JSON' } }, { status: 400 });
  }

  const parsed = PrepQuestionsRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: msg } }, { status: 400 });
  }

  // 3. Check API key & Adapter availability (Fail closed)
  const apiKey = deps.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !deps.modelCaller) {
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Interview prep generation is not configured. Missing Anthropic API key.' } },
      { status: 503 },
    );
  }

  if (!deps.getAuthorizedJob || !deps.getStudentFacts) {
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Job and profile data adapters are pending from Keyan.' } },
      { status: 503 },
    );
  }

  // 4. Load authorized job & facts server-side
  const job = await deps.getAuthorizedJob(parsed.data.jobId);
  if (!job) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Job not found' } }, { status: 404 });
  }

  const facts = await deps.getStudentFacts(userId);

  // 5. Generate questions
  if (!deps.modelCaller) {
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Model caller not available.' } },
      { status: 503 },
    );
  }

  const genResult = await generatePrepQuestions({
    job,
    facts,
    modelCaller: deps.modelCaller,
  });

  if (!genResult.ok) {
    return NextResponse.json({ error: { code: genResult.code, message: genResult.error } }, { status: 502 });
  }

  return NextResponse.json({ data: { questions: genResult.questions } });
}

// ============================================================================
// 2. Prep Buzzwords Handler & Types
// ============================================================================

const PrepBuzzwordsRequestSchema = z.object({
  jobId: z.string().uuid(),
  consent: z.literal(true, {
    message: 'Explicit student consent is required to process job details for interview preparation',
  }),
});

export interface PrepBuzzwordsRouteDeps {
  getUser?: () => Promise<{ id: string } | null>;
  getAuthorizedJob?: (id: string) => Promise<JobPosting | null>;
  modelCaller?: ModelCaller;
  apiKey?: string;
}

export async function handlePrepBuzzwords(
  request: Request,
  deps: PrepBuzzwordsRouteDeps = {},
): Promise<Response> {
  // 1. Authenticate caller session
  if (deps.getUser) {
    const user = await deps.getUser();
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
    }
  } else {
    try {
      const { createSupabaseServerClient } = await import('../supabase/server');
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
    }
  }

  // 2. Read bounded request body
  const bodyResult = await readBoundedBody(request, MAX_RAW_BODY_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: { code: bodyResult.code, message: bodyResult.message } }, { status: bodyResult.status });
  }

  if (!bodyResult.text.trim()) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Request body is empty' } }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Request body must be valid JSON' } }, { status: 400 });
  }

  const parsed = PrepBuzzwordsRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: msg } }, { status: 400 });
  }

  // 3. Check API key & Adapter availability (Fail closed)
  const apiKey = deps.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !deps.modelCaller) {
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Interview prep generation is not configured. Missing Anthropic API key.' } },
      { status: 503 },
    );
  }

  if (!deps.getAuthorizedJob) {
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Job data adapter is pending from Keyan.' } },
      { status: 503 },
    );
  }

  // 4. Load authorized job server-side
  const job = await deps.getAuthorizedJob(parsed.data.jobId);
  if (!job) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Job not found' } }, { status: 404 });
  }

  // 5. Generate buzzwords
  if (!deps.modelCaller) {
    return NextResponse.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Model caller not available.' } },
      { status: 503 },
    );
  }

  try {
    const result = await generatePrepBuzzwords({
      job,
      modelCaller: deps.modelCaller,
    });

    if (!result.ok) {
      const status = result.code === 'INVALID_INPUT' ? 400 : 502;
      return NextResponse.json({ error: { code: result.code, message: result.error } }, { status });
    }

    return NextResponse.json({ data: { buzzwords: result.buzzwords } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Buzzword generation failed';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}

// ============================================================================
// 3. Prep News Handler & Types
// ============================================================================

export interface PrepNewsRouteDeps {
  getUser?: () => Promise<{ id: string } | null>;
  searchNewsFn?: (query: string, options?: SearchNewsOptions) => Promise<SearchNewsResult>;
  provider?: string;
  apiKey?: string;
}

export async function handlePrepNews(
  request: Request,
  deps: PrepNewsRouteDeps = {},
): Promise<Response> {
  // 1. Authenticate caller session
  if (deps.getUser) {
    const user = await deps.getUser();
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
    }
  } else {
    try {
      const { createSupabaseServerClient } = await import('../supabase/server');
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } }, { status: 401 });
    }
  }

  // 2. Parse query parameters
  const url = new URL(request.url);
  const query = url.searchParams.get('query');

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Missing required query parameter: query' } },
      { status: 400 },
    );
  }

  if (query.trim().length > 100) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Query parameter exceeds maximum length of 100 characters' } },
      { status: 400 },
    );
  }

  // 3. Search news using single provider selector
  const searchFn = deps.searchNewsFn ?? searchNews;
  const result = await searchFn(query, {
    provider: deps.provider,
    apiKey: deps.apiKey,
  });

  if (!result.ok) {
    const status = result.code === 'INVALID_INPUT' ? 400 : 502;
    return NextResponse.json({ error: { code: result.code, message: result.error } }, { status });
  }

  return NextResponse.json({
    data: {
      items: result.items,
      enabled: result.enabled,
      provider: result.provider,
      ...(!result.enabled
        ? { note: 'Live news search is disabled (JOB_SEARCH_PROVIDER=none or unconfigured).' }
        : {}),
    },
  });
}


