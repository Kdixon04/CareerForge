# Dallas (Antigravity) ↔ Keyan Adapter Request

**Date:** 2026-11-14
**From:** Dallas / Antigravity (server jobs & résumé routes)
**To:** Keyan (Supabase schema, RLS, & database adapters)

---

## 1. Context & Motivation

On `main`, Keyan's PR #32 landed `listPublishedJobs()` and `getPublishedJob(id)` in `src/lib/jobs/job-adapter.ts`.
However, the private pasted-job workflow required for MVP student application tracking is still missing its database adapters:
1. `createPrivateJobImport(draft: JobDraft)`
2. `getAuthorizedJob(id: string)`

Per AGENTS.md and team rules, Antigravity does **not** edit Keyan's files (`src/lib/data/**` or `supabase/**`) and will not create fake in-memory persistence. Cursor's PR #27 has already prepared the UI client boundary (`job-api-client.ts`) and is waiting for Antigravity's real server routes (`POST /api/jobs/import` and `GET /api/jobs/[id]`).

---

## 2. Requested Adapter Signatures & Contracts

We request Keyan to publish the following two functions in `src/lib/jobs/job-adapter.ts` (or `src/lib/data/jobs.ts`):

### A. `createPrivateJobImport`
```ts
import type { JobDraft, JobPosting } from '../../contracts';

/**
 * Inserts a private pasted job for the authenticated caller.
 *
 * Requirements:
 * - Uses `createSupabaseServerClient()` to enforce RLS (`jobs_insert_own`).
 * - Validates verified session (`supabase.auth.getUser()`); throws if unauthenticated.
 * - Server sets:
 *     - `id`: database-generated UUID (`gen_random_uuid()`)
 *     - `source`: 'pasted'
 *     - `status`: 'private'
 *     - `created_by_user_id`: caller's `user.id`
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
 * Requirements:
 * - Uses `createSupabaseServerClient()` to enforce RLS (`jobs_select_authorized`).
 * - Under RLS:
 *     - Students can read their own private pasted jobs (`created_by_user_id = auth.uid()`).
 *     - Students can read published employer jobs (`status = 'published' AND source = 'employer'`).
 *     - Students can read paused jobs they previously saved.
 * - Returns `JobPosting` if found and accessible.
 * - Returns `null` if the job does not exist OR is a private job belonging to another user.
 *   (Crucial: never expose the existence of foreign private jobs).
 */
export async function getAuthorizedJob(id: string): Promise<JobPosting | null>;
```

---

## 3. Server Route Implementation Plan (Antigravity Slice)

Once Keyan publishes the two functions above, Antigravity will immediately implement and land:

### Route 1: `POST /api/jobs/import`
1. Authenticate caller with `createSupabaseServerClient().auth.getUser()`. If null, return `401 UNAUTHENTICATED`.
2. Validate raw request body with `readBoundedBody` and `JobDraftSchema`. If invalid, return `400 INVALID_INPUT`.
3. Call Keyan's `createPrivateJobImport(draft)`.
4. Return `200` with `{ data: JobPosting }`.

### Route 2: `GET /api/jobs/[id]`
1. Authenticate caller with `createSupabaseServerClient().auth.getUser()`. If null, return `401 UNAUTHENTICATED`.
2. Validate `id` is a UUID. If not, return `404 NOT_FOUND`.
3. Call Keyan's `getAuthorizedJob(id)`.
4. If null, return `404 NOT_FOUND` (`{ error: { code: 'NOT_FOUND', message: 'Job not found' } }`).
5. If found, return `200` with `{ data: JobPosting }`.

---

## 4. Testing & Verification Plan

This PR supplies a helper only. Its earlier hand-built authorization examples were removed because they did not call any route or RLS policy. The checks below are pending until the named routes and ordinary-session adapters exist; they have not passed yet.

1. **Unit & Route Tests (Mocked DB)**:
   - Signed-out request returns 401.
   - Valid draft import returns 200 with server-derived owner and private status.
   - Foreign job read returns 404 (isolation test).
   - Non-existent job read returns 404.
2. **Integration / Smoke Tests (Real Test DB)**:
   - Student A imports a private job -> reads it back -> succeeds.
   - Student B attempts to read Student A's private job -> receives 404.
   - Published employer job is readable by both Student A and Student B.
