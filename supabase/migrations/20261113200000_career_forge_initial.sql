-- Career Forge MVP database contract.
-- Apply through the Supabase CLI after review; this migration does not seed data.
-- Recovery: take a backup/snapshot before applying. Revert by restoring the
-- migration's objects in a reviewed follow-up migration; do not reset production.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'employer', 'admin');
create type public.student_fact_kind as enum ('skill', 'education', 'project', 'experience', 'interest');
create type public.job_source as enum ('pasted', 'claude_web', 'employer', 'provider');
create type public.job_status as enum ('private', 'draft', 'published', 'paused', 'hidden');
create type public.application_status as enum ('saved', 'applied', 'interviewing', 'offer', 'rejected');
create type public.job_verification_status as enum ('unverified', 'verified', 'expired');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  field text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  assigned_at timestamptz not null default timezone('utc', now()),
  assigned_by uuid references auth.users(id)
);

create table public.employers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null check (length(btrim(company_name)) between 1 and 200),
  description text,
  website text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.student_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.student_fact_kind not null,
  text text not null check (length(btrim(text)) between 1 and 2000),
  dates text,
  org text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 300),
  company text not null check (length(btrim(company)) between 1 and 300),
  description text not null check (length(description) between 1 and 20000),
  location text,
  job_type text not null default 'unknown',
  work_mode text not null default 'unknown',
  source public.job_source not null,
  provider_name text,
  external_id text,
  source_url text,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  employer_id uuid references public.employers(id) on delete restrict,
  status public.job_status not null default 'private',
  retrieved_at timestamptz,
  deadline date,
  deadline_verified boolean not null default false,
  verification_status public.job_verification_status not null default 'unverified',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint employer_job_provenance check (
    (source = 'employer' and employer_id is not null and status in ('draft', 'published', 'paused', 'hidden'))
    or
    (source <> 'employer' and employer_id is null)
  )
);

create table public.saved_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete restrict,
  status public.application_status not null default 'saved',
  deadline date,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, job_id)
);

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete restrict,
  generated_payload jsonb not null default '{}'::jsonb,
  edited_bullets jsonb not null default '[]'::jsonb,
  fact_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Raw view rows are private. Employer analytics use the aggregate RPC below.
create table public.job_views (
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewer_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (job_id, viewer_user_id)
);

create index student_facts_user_id_idx on public.student_facts(user_id);
create index jobs_created_by_user_id_idx on public.jobs(created_by_user_id);
create index jobs_employer_id_status_idx on public.jobs(employer_id, status);
create index saved_applications_user_id_idx on public.saved_applications(user_id);
create index resume_versions_user_id_idx on public.resume_versions(user_id);

create unique index jobs_provider_identity_idx
  on public.jobs(source, provider_name, external_id)
  where external_id is not null;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger employers_set_updated_at before update on public.employers
  for each row execute function public.set_updated_at();
create trigger student_facts_set_updated_at before update on public.student_facts
  for each row execute function public.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger saved_applications_set_updated_at before update on public.saved_applications
  for each row execute function public.set_updated_at();
create trigger resume_versions_set_updated_at before update on public.resume_versions
  for each row execute function public.set_updated_at();

-- New accounts receive the least-privileged role. Admin/employer promotion is
-- performed by trusted server-side setup, never by a browser-editable field.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student')
    on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.is_employer_owner(target_employer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.employers
    where id = target_employer_id and owner_user_id = auth.uid()
  );
$$;

create or replace function public.can_read_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.jobs j
    where j.id = target_job_id
      and (
        j.created_by_user_id = auth.uid()
        or (j.status = 'published' and j.source = 'employer')
        or (j.status = 'paused' and exists (
          select 1 from public.saved_applications sa
          where sa.job_id = j.id and sa.user_id = auth.uid()
        ))
        or (public.has_role('admin') and j.source = 'employer')
      )
  );
$$;

-- Prevent ordinary authenticated updates from changing provenance or the
-- immutable generated evidence stored with a resume version.
create or replace function public.protect_immutable_fields()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_table_name = 'jobs' then
      if new.created_by_user_id <> old.created_by_user_id
        or new.employer_id is distinct from old.employer_id
        or new.source <> old.source
        or new.provider_name is distinct from old.provider_name
        or new.external_id is distinct from old.external_id
        or new.retrieved_at is distinct from old.retrieved_at
        or new.verification_status <> old.verification_status
        or new.deadline_verified <> old.deadline_verified then
        raise exception 'immutable job provenance cannot be changed';
      end if;
    elsif tg_table_name = 'resume_versions' then
      if new.generated_payload <> old.generated_payload
        or new.fact_snapshot <> old.fact_snapshot then
        raise exception 'generated resume data is immutable';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger jobs_protect_immutable before update on public.jobs
  for each row execute function public.protect_immutable_fields();
create trigger resume_versions_protect_immutable before update on public.resume_versions
  for each row execute function public.protect_immutable_fields();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.employers enable row level security;
alter table public.student_facts enable row level security;
alter table public.jobs enable row level security;
alter table public.saved_applications enable row level security;
alter table public.resume_versions enable row level security;
alter table public.job_views enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.employers to authenticated;
grant select, insert, update, delete on public.student_facts to authenticated;
grant select, insert, update on public.jobs to authenticated;
grant select, insert, update, delete on public.saved_applications to authenticated;
grant select, insert, update on public.resume_versions to authenticated;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_employer_owner(uuid) to authenticated;
grant execute on function public.can_read_job(uuid) to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy user_roles_select_own on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy employers_select_own_or_admin on public.employers for select to authenticated
  using (owner_user_id = auth.uid() or public.has_role('admin'));
create policy employers_insert_own on public.employers for insert to authenticated
  with check (owner_user_id = auth.uid() and public.has_role('employer'));
create policy employers_update_own on public.employers for update to authenticated
  using (owner_user_id = auth.uid() and public.has_role('employer'))
  with check (owner_user_id = auth.uid() and public.has_role('employer'));

create policy student_facts_select_own on public.student_facts for select to authenticated
  using (user_id = auth.uid());
create policy student_facts_insert_own on public.student_facts for insert to authenticated
  with check (user_id = auth.uid() and public.has_role('student'));
create policy student_facts_update_own on public.student_facts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy student_facts_delete_own on public.student_facts for delete to authenticated
  using (user_id = auth.uid());

create policy jobs_select_authorized on public.jobs for select to authenticated
  using (
    created_by_user_id = auth.uid()
    or (status = 'published' and source = 'employer')
    or (status = 'paused' and exists (
      select 1 from public.saved_applications sa
      where sa.job_id = jobs.id and sa.user_id = auth.uid()
    ))
    or (public.has_role('admin') and source = 'employer')
  );
create policy jobs_insert_own on public.jobs for insert to authenticated
  with check (
    created_by_user_id = auth.uid()
    and (
      (source = 'employer' and public.has_role('employer') and public.is_employer_owner(employer_id))
      or (source <> 'employer' and employer_id is null and status = 'private')
    )
  );
create policy jobs_update_own on public.jobs for update to authenticated
  using (
    created_by_user_id = auth.uid()
    and (
      source <> 'employer'
      or public.is_employer_owner(employer_id)
    )
  )
  with check (
    created_by_user_id = auth.uid()
    and (
      (source = 'employer' and public.has_role('employer') and public.is_employer_owner(employer_id))
      or (source <> 'employer' and employer_id is null)
    )
  );

create policy saved_applications_select_own on public.saved_applications for select to authenticated
  using (user_id = auth.uid());
create policy saved_applications_insert_own on public.saved_applications for insert to authenticated
  with check (user_id = auth.uid() and public.has_role('student') and public.can_read_job(job_id));
create policy saved_applications_update_own on public.saved_applications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_applications_delete_own on public.saved_applications for delete to authenticated
  using (user_id = auth.uid());

create policy resume_versions_select_own on public.resume_versions for select to authenticated
  using (user_id = auth.uid());
create policy resume_versions_insert_own on public.resume_versions for insert to authenticated
  with check (user_id = auth.uid() and public.has_role('student') and (job_id is null or public.can_read_job(job_id)));
create policy resume_versions_update_own on public.resume_versions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No direct client grants or policies exist for job_views. Clients call the
-- constrained function, which records one view per authenticated student/job.
create or replace function public.record_job_view(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if auth.uid() is null or not public.has_role('student') then
    raise exception 'student authentication required';
  end if;
  if not exists (
    select 1 from public.jobs
    where id = p_job_id and source = 'employer' and status = 'published'
  ) then
    raise exception 'published employer job required';
  end if;
  insert into public.job_views (job_id, viewer_user_id)
    values (p_job_id, auth.uid())
    on conflict (job_id, viewer_user_id) do nothing;
end;
$$;

create or replace function public.get_employer_stats()
returns table (job_id uuid, unique_viewers bigint, current_saves bigint)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select j.id,
    (select count(*) from public.job_views v where v.job_id = j.id),
    (select count(*) from public.saved_applications sa where sa.job_id = j.id)
  from public.jobs j
  where j.source = 'employer'
    and public.is_employer_owner(j.employer_id);
$$;

revoke execute on function public.record_job_view(uuid) from public, anon, authenticated;
revoke execute on function public.get_employer_stats() from public, anon, authenticated;
grant execute on function public.record_job_view(uuid) to authenticated;
grant execute on function public.get_employer_stats() to authenticated;

comment on table public.user_roles is 'Trusted role assignment only; do not expose role mutation to browser clients.';
comment on table public.job_views is 'Approximate unique authenticated-student view metric; raw rows are never exposed to employers.';
comment on function public.record_job_view(uuid) is 'Counts one view per authenticated student and published employer job.';
comment on function public.get_employer_stats() is 'Returns counts only for listings owned by the authenticated employer.';
