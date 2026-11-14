# Career Forge database integration handoff

Status: database schema and RLS are applied to the Supabase `main` project and verified with fictional user sessions. The repository still has no application scaffold, package file, shared TypeScript contracts, or Supabase client layer.

## Integration boundaries

- Database-owned paths: `supabase/**`, future `src/lib/supabase/**`, future `src/lib/data/**`, and `tests/security/**`.
- Dallas reviews shared contracts and owns application scaffold, package/config files, jobs/search/resume routes, and shared runtime schemas.
- Steve owns profile and saved-application UI/API paths.
- Do not add a second schema, role field, save counter, or employer jobs route.

## Tables used by adapters

- `profiles`: authenticated user's `id`, `display_name`, nullable `field`, timestamps.
- `user_roles`: protected role lookup; browser clients can read their own role but cannot mutate roles.
- `employers`: one `owner_user_id` and company details per employer account.
- `student_facts`: owner, `kind`, `text`, optional `dates` and `org`.
- `jobs`: persisted job content plus server-controlled source, ownership, employer, status, retrieval, external identity, and verification fields.
- `saved_applications`: unique `(user_id, job_id)`, status, personal deadline, notes.
- `resume_versions`: generated payload, student edits, and immutable fact snapshot.
- `job_views`: private deduplicated `(job_id, viewer_user_id)` rows; never expose raw rows to employers.

## Adapter operations to implement

Use a user-scoped Supabase client so RLS applies. Derive identity from the verified session; never accept `userId`, `role`, ownership, source, or verification as authority from the browser.

- `getOwnProfile()` and atomic `saveOwnProfile(displayName, field, facts)`.
- `listAuthorizedJobs(filters)` and `getAuthorizedJob(jobId)`.
- `createPrivateJobImport(input)`; the server assigns `source=pasted`, owner, `status=private`, and retrieval metadata.
- `listOwnApplications()`, `saveApplication(jobId)`, `updateApplication(id, patch)`, and `removeApplication(id)`.
- `createResumeVersion(jobId, generatedPayload, editedBullets, factSnapshot)` and own-version read/update operations. Generated payload and fact snapshot are immutable after insert. The browser has no direct insert grant for `resume_versions`; creation must occur through a server-side, validated generation path using a privileged server client or a narrowly scoped RPC.
- Employer-owned listing CRUD using `source=employer`, `employer_id`, and allowed statuses `draft|published|paused`.
- `record_job_view(jobId)` RPC for a visible published employer job.
- `get_employer_stats()` RPC; returns counts only for the authenticated employer's listings.

## Expected security behavior

- Student-owned reads/writes are isolated by `auth.uid()`.
- Published employer jobs are readable by authenticated students; drafts and hidden listings are not.
- A student who saved a listing may continue reading a paused copy as inactive.
- Employers can manage only their own employer listings and receive only their own aggregate stats.
- Raw `job_views` are not client-readable. Repeated view calls for one student/job are deduplicated.
- Saves are derived from `saved_applications`; repeated insert attempts cannot create a second row.
- `user_roles` is trusted setup data. Employer/admin promotion occurs through controlled SQL or server administration, never signup metadata.

## Environment/configuration handoff

Browser-safe configuration may contain only the project URL and publishable/anon key. Never expose a service-role/secret key in browser code. Server-only secrets belong in the integration owner's environment configuration and should not be added to this database handoff.

## Verification evidence

The repeatable checks are in `supabase/SECURITY_CHECKS.md` and `supabase/security_checks.ps1`. The current fictional-session run verified both directions of student isolation, student role escalation denial, published-job visibility, cross-employer draft isolation, employer stats isolation, duplicate-save prevention, unsave count behavior, and deduplicated views.
