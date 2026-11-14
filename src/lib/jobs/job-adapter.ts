import { JobPostingSchema, type JobPosting } from '../../contracts';
import { createSupabaseServerClient } from '../supabase/server';

type JobRow = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  job_type: JobPosting['jobType'];
  work_mode: JobPosting['workMode'];
  source: JobPosting['source'];
  provider_name: string | null;
  external_id: string | null;
  source_url: string | null;
  created_by_user_id: string;
  employer_id: string | null;
  status: JobPosting['status'];
  retrieved_at: string | null;
  deadline: string | null;
  deadline_verified: boolean;
  created_at: string;
  updated_at: string;
};

function toJobPosting(row: JobRow): JobPosting {
  return JobPostingSchema.parse({
    id: row.id,
    title: row.title,
    company: row.company,
    description: row.description,
    location: row.location,
    jobType: row.job_type,
    workMode: row.work_mode,
    source: row.source,
    providerName: row.provider_name,
    externalId: row.external_id,
    sourceUrl: row.source_url,
    createdByUserId: row.created_by_user_id,
    employerId: row.employer_id,
    status: row.status,
    retrievedAt: row.retrieved_at
      ? new Date(row.retrieved_at).toISOString()
      : null,
    deadline: row.deadline,
    deadlineVerified: row.deadline_verified,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  });
}

export async function listPublishedJobs(): Promise<JobPosting[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, title, company, description, location, job_type, work_mode, source, provider_name, external_id, source_url, created_by_user_id, employer_id, status, retrieved_at, deadline, deadline_verified, created_at, updated_at',
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Unable to load jobs');
  }

  return (data as JobRow[]).map(toJobPosting);
}

export async function getPublishedJob(id: string): Promise<JobPosting | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, title, company, description, location, job_type, work_mode, source, provider_name, external_id, source_url, created_by_user_id, employer_id, status, retrieved_at, deadline, deadline_verified, created_at, updated_at',
    )
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    throw new Error('Unable to load job');
  }

  return data ? toJobPosting(data as JobRow) : null;
}