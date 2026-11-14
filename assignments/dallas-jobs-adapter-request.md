# Dallas (Antigravity) ↔ Keyan Adapter Request

**Date:** 2026-11-14  
**From:** Dallas / Antigravity (server jobs & résumé routes)  
**To:** Keyan (Supabase schema, RLS, & database adapters)  

---

## 1. Context & Path Ownership Correction

Per AGENTS.md:
- `src/lib/jobs/**` is **Dallas-owned**.
- `src/lib/data/**` and `src/lib/supabase/**` are **Keyan-owned**.

Keyan's PR #32 previously added `listPublishedJobs()` and `getPublishedJob(id)` in `src/lib/jobs/job-adapter.ts`. Dallas notes that `src/lib/jobs/**` is a Dallas path, while Keyan's adapters belong in `src/lib/data/**`.

For the private pasted-job import and read workflow required for the MVP student journey, we request Keyan to publish the user-scoped database adapters in **`src/lib/data/jobs.ts`** (or `src/lib/data/**`). Antigravity does **not** edit Keyan's paths, will **not** implement Keyan's database adapters, and will **not** create fake in-memory persistence.

Cursor's PR #27 has prepared the UI client boundary (`src/app/(student)/jobs/job-api-client.ts`) with `IS_JOB_PERSISTENCE_AVAILABLE = false`, waiting for verified server routes. Antigravity has prepared the route-level logic and test specifications in `src/lib/jobs/private-job-handlers.ts`, waiting for Keyan's real adapters.

---

## 2. Requested Adapter Signatures & Contracts

Keyan to export the following two user-scoped functions from **`src/lib/data/jobs.ts`**:

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
 *   (Crucial: never expose the existence of foreign private jobs; must return null so route returns 404).
 */
export async function getAuthorizedJob(id: string): Promise<JobPosting | null>;
```

---

## 3. Database & RLS Status (Verified)

Keyan's applied migration `supabase/migrations/20261113200000_career_forge_initial.sql` already provides the necessary RLS policies:
1. `jobs_insert_own`: Allows insert when `created_by_user_id = auth.uid()` and `source <> 'employer' and employer_id is null and status = 'private'`.
2. `jobs_select_authorized`: Allows select when `created_by_user_id = auth.uid()` OR `(status = 'published' and source = 'employer')` OR user saved the paused listing.

The migration and RLS are already in place; only the TypeScript adapter functions in `src/lib/data/jobs.ts` are needed.

---

## 4. Antigravity Server Route Plan (Dallas Paths)

Once Keyan provides `src/lib/data/jobs.ts`, Antigravity will connect:
- `POST /api/jobs/import` -> reads bounded body via `readBoundedBody()`, validates `JobDraftSchema`, verifies session, calls `createPrivateJobImport(draft)`, returns `{ data: JobPosting }`.
- `GET /api/jobs/[id]` -> validates UUID, verifies session, calls `getAuthorizedJob(id)`, returns `{ data: JobPosting }` or `{ error: { code: 'NOT_FOUND', message: 'Job not found' } }` (404).

Until Keyan's adapters land, live routes are not exposed to pretend data is saved, and integration remains explicitly blocked.
