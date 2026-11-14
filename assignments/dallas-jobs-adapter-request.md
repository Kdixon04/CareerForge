# Dallas (Antigravity) ↔ Keyan Adapter Request & Enablement Guide

**Date:** 2026-11-14  
**Target:** Truthful MVP demo & submission by 4:00 PM America/Denver  
**From:** Dallas / Antigravity (server jobs & résumé routes)  
**To:** Keyan (database schema, RLS, & adapters) & Cursor (student UI integrator)  

---

## 1. Path Ownership & Boundaries

Per AGENTS.md:
- `src/lib/data/**` and `src/lib/supabase/**` are **Keyan-owned** (security-sensitive database/RLS layer).
- `src/lib/jobs/**` and `src/app/api/jobs/**` are **Dallas-owned** (server HTTP handlers and logic).
- `src/app/(student)/jobs/**` is **Cursor-owned** (student UI).

Keyan's database adapters must reside in **`src/lib/data/jobs.ts`** (or `src/lib/data/**`). Dallas/Antigravity does **not** edit Keyan's paths, will **not** implement Keyan's database adapters, and will **not** create fake in-memory persistence. Everything stays fail-closed and truthful.

---

## 2. Requested Adapter Signatures & Contracts

Keyan to create and export the following user-scoped functions in **`src/lib/data/jobs.ts`**:

### A. `createPrivateJobImport`

```ts
import type { JobDraft, JobPosting } from '../../contracts';

/**
 * Inserts a private pasted job for the authenticated caller.
 *
 * Location: src/lib/data/jobs.ts (Keyan-owned)
 *
 * Requirements:
 * - Uses `createSupabaseServerClient()` to enforce RLS (`jobs_insert_own`).
 * - Validates verified session (`supabase.auth.getUser()`); throws if unauthenticated.
 * - Server sets:
 *     - `id`: database-generated UUID (`gen_random_uuid()`)
 *     - `source`: 'pasted'
 *     - `status`: 'private'
 *     - `created_by_user_id`: caller's `user.id` (auth.uid())
 *     - `employer_id`: null
 *     - `provider_name`: null
 *     - `external_id`: null
 *     - `retrieved_at`: null
 *     - `deadline_verified`: false
 * - Returns the created `JobPosting` conforming to `JobPostingSchema`.
 */
export async function createPrivateJobImport(draft: JobDraft): Promise<JobPosting>;
```

### B. `getAuthorizedJob`

```ts
/**
 * Retrieves a job posting if the authenticated caller is authorized to view it.
 *
 * Location: src/lib/data/jobs.ts (Keyan-owned)
 *
 * Requirements:
 * - Uses `createSupabaseServerClient()` to enforce RLS (`jobs_select_authorized`).
 * - Under RLS:
 *     - Students can read their own private pasted jobs (`created_by_user_id = auth.uid()`).
 *     - Students can read published employer jobs (`status = 'published' AND source = 'employer'`).
 *     - Students can read paused jobs they previously saved.
 * - Returns `JobPosting` if found and accessible.
 * - Returns `null` if the job does not exist OR is a private job belonging to another user.
 *   (Crucial: never expose the existence of foreign private jobs; returns null so route returns 404).
 */
export async function getAuthorizedJob(id: string): Promise<JobPosting | null>;
```

---

## 3. Database & RLS Status (Verified on `main`)

Keyan's applied migration `supabase/migrations/20261113200000_career_forge_initial.sql` already provides the necessary RLS policies on the `jobs` table:
1. `jobs_insert_own`:
   ```sql
   create policy jobs_insert_own on public.jobs for insert to authenticated
     with check (
       created_by_user_id = auth.uid()
       and (
         (source = 'employer' and public.has_role('employer') and public.is_employer_owner(employer_id))
         or (source <> 'employer' and employer_id is null and status = 'private')
       )
     );
   ```
2. `jobs_select_authorized`:
   ```sql
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
   ```

The database tables and RLS policies are applied and verified. Only the TypeScript adapter functions in `src/lib/data/jobs.ts` are needed.

---

## 4. Current State: Inert & Fail-Closed Routes

Antigravity has prepared the route handlers in:
- `src/app/api/jobs/import/route.ts`
- `src/app/api/jobs/[id]/route.ts`
- Backing logic in `src/lib/jobs/private-job-handlers.ts`

**While Keyan's adapter in `src/lib/data/jobs.ts` is absent:**
- Both routes run in fail-closed mode and return `503 SERVICE_UNAVAILABLE` ("Job persistence adapter is not available. Waiting for Keyan data adapter.").
- No fake in-memory persistence exists.
- No false claims of database persistence are made.

---

## 5. One-Line Enablement Steps

Once Keyan lands `src/lib/data/jobs.ts`:

### Step 1: Antigravity Routes (One-Line Enablement)
- In `src/app/api/jobs/import/route.ts`:
  ```ts
  import { createPrivateJobImport } from '../../../../lib/data/jobs';
  // Change return line to:
  return handleImportJob(request, { adapter: { createPrivateJobImport } });
  ```
- In `src/app/api/jobs/[id]/route.ts`:
  ```ts
  import { getAuthorizedJob } from '../../../../lib/data/jobs';
  // Change return line to:
  return handleGetJob(id, { adapter: { getAuthorizedJob } });
  ```

### Step 2: Cursor UI Flag Flip (One-Line Enablement)
- In `src/app/(student)/jobs/job-api-client.ts`:
  ```ts
  export const IS_JOB_PERSISTENCE_AVAILABLE = true;
  ```

### Step 3: Run Guarded Real DB Isolation Test
- Enable and run `tests/e2e/dallas-private-jobs-db.spec.ts` with live Supabase test credentials (`E2E_STUDENT_A_*`, `E2E_STUDENT_B_*`).

---

## 6. Documented Demo Fallback / Cut (4:00 PM Submission Guardrail)

If Keyan's `src/lib/data/jobs.ts` adapter does not land in time for the 4:00 PM America/Denver deadline:
1. **Fallback Mode Confirmed:**
   - Real database persistence is proven on **Profile** (`GET/PATCH /api/profile`) and **Published Jobs Browse/Detail** (`listPublishedJobs` / `getPublishedJob`).
   - Pasted jobs remain in their clearly labeled **Preview Mode**:
     - Badge: `Preview — not saved` / `● Unverified`.
     - Button: `Save as private job (not connected)` remains disabled.
     - Notice: `Parse preview only — not saved`.
   - The demo truthfully presents the pasted-job parse as an ephemeral preview, exactly as built.
2. **Strict Rule:**
   - Never fake persistence with in-memory stores or mock sessions.
   - The app remains completely honest and transparent about what persists and what is preview.
