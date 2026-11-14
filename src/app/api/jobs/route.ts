import { NextRequest, NextResponse } from 'next/server';
import { JobDraftSchema, JobPostingSchema } from '../../../contracts';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = JobDraftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid job data' },
      { status: 400 },
    );
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
      location: parsed.data.location,
      job_type: parsed.data.jobType,
      work_mode: parsed.data.workMode,
      source: 'pasted',
      provider_name: null,
      external_id: null,
      source_url: parsed.data.sourceUrl,
      created_by_user_id: user.id,
      employer_id: null,
      status: 'private',
      retrieved_at: null,
      deadline: parsed.data.deadline,
      deadline_verified: false,
      verification_status: 'unverified',
    })
    .select(
      'id, title, company, description, location, job_type, work_mode, source, provider_name, external_id, source_url, created_by_user_id, employer_id, status, retrieved_at, deadline, deadline_verified, created_at, updated_at',
    )
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: 'Unable to save job' },
      { status: 500 },
    );
  }

  const posting = JobPostingSchema.parse({
    id: job.id,
    title: job.title,
    company: job.company,
    description: job.description,
    location: job.location,
    jobType: job.job_type,
    workMode: job.work_mode,
    source: job.source,
    providerName: job.provider_name,
    externalId: job.external_id,
    sourceUrl: job.source_url,
    createdByUserId: job.created_by_user_id,
    employerId: job.employer_id,
    status: job.status,
    retrievedAt: job.retrieved_at
      ? new Date(job.retrieved_at).toISOString()
      : null,
    deadline: job.deadline,
    deadlineVerified: job.deadline_verified,
    createdAt: new Date(job.created_at).toISOString(),
    updatedAt: new Date(job.updated_at).toISOString(),
  });

  return NextResponse.json({ data: posting }, { status: 201 });
}