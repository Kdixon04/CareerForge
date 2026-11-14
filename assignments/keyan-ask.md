# What we need from Keyan (12:00 handoff)

**Date:** 2026-11-14 · **Deadline:** 4:00 PM America/Denver · **Audience:** Keyan  
**Status on `main` (~`c35702c`):** Auth + Supabase clients merged; profile and published-jobs routes exist; **inert** private-job HTTP routes merged (`POST /api/jobs/import`, `GET /api/jobs/[id]`) — they return **503** until `src/lib/data/jobs.ts` exists. **No `src/lib/data/**` in the repo yet.**

---

## 1. Migrations to confirm applied

Report the exact migration ids applied to the Supabase project used for deploy/demo:

| File | Id (prefix) |
|------|-------------|
| `supabase/migrations/20261113200000_career_forge_initial.sql` | `20261113200000` |
| `supabase/migrations/20261114091500_security_integrity_fixes.sql` | `20261114091500` |

Reference: `supabase/INTEGRATION_HANDOFF.md`, `supabase/SECURITY_CHECKS.md`.

---

## 2. Priority adapters (student MVP path)

All adapters use **`createSupabaseServerClient()`** (or equivalent user-scoped client) so **RLS applies**. Identity from **`supabase.auth.getUser()`** — never trust client-supplied `userId`.

### A. Jobs — `src/lib/data/jobs.ts` (blocking private import + detail)

Already documented in code via `JobDataAdapter` in `src/lib/jobs/private-job-handlers.ts`:

```ts
import type { JobDraft, JobPosting } from '../../contracts';

export async function createPrivateJobImport(draft: JobDraft): Promise<JobPosting>;
export async function getAuthorizedJob(id: string): Promise<JobPosting | null>;
```

**RLS (already in initial migration):**
- Insert: policy `jobs_insert_own` — `created_by_user_id = auth.uid()`, `source <> 'employer'`, `employer_id` null, `status = 'private'` for pasted imports; server must set `source: 'pasted'`, `status: 'private'`, `deadline_verified: false`, provenance fields.
- Select: policy `jobs_select_authorized` — own private rows, published employer jobs, paused jobs the student saved, etc.; return **`null`** (not an error) for foreign/missing private jobs so routes can return indistinguishable **404**.

**Wiring waiters:** Antigravity one-line enablement in `src/app/api/jobs/import/route.ts` and `src/app/api/jobs/[id]/route.ts`; then Cursor flips `IS_JOB_PERSISTENCE_AVAILABLE` in `src/app/(student)/jobs/job-api-client.ts` (only after adapter + wiring verified).

### B. Résumé — `src/lib/data/resume.ts` (or grouped module) (blocking suggest/save/reload)

`generateResumeSuggestions` in `src/lib/claude/resume-suggest.ts` returns `{ ok: true, version: ResumeVersion }` conforming to `ResumeVersionSchema` (`src/contracts/resume.ts`). Antigravity will add HTTP routes per AGENTS.md; Keyan must persist via restricted path (RLS: students own rows; **generated payload + fact snapshot immutable** after insert — see migration triggers on `resume_versions`).

Suggested exports (names can match Steve/Keyan convention if already chosen):

```ts
import type { ResumeVersion } from '../../contracts';

/** Insert after server-side generation; caller must be authenticated student with job access. */
export async function createResumeVersion(version: ResumeVersion): Promise<ResumeVersion>;

/** Own row only; null → route returns 404. */
export async function getOwnResumeVersion(id: string): Promise<ResumeVersion | null>;

/** Update edited_bullets only for own row; reject changes to generated/snapshot fields. */
export async function updateOwnResumeEdits(
  id: string,
  editedBullets: { id: string; text: string }[],
): Promise<ResumeVersion>;
```

**RLS:** policies `resume_versions_select_own`, `_insert_own`, `_update_own`; browser must not insert generated rows directly (use server path / RPC per `INTEGRATION_HANDOFF.md`).

### C. Profile + published jobs (should already exist — confirm)

If already implemented under another path, publish **`src/lib/data/**` names** so Dallas docs stay accurate:

- `getOwnProfile` / `saveOwnProfile` (atomic facts save) — Steve's `GET/PUT /api/profile`.
- `listPublishedJobs` / `getPublishedJob` — currently in `src/lib/jobs/job-adapter.ts` (Keyan to confirm whether data layer moves to `src/lib/data` or stays as-is).

### D. Applications (ONLY if we keep saved-application persistence — see scope cut)

**Proposed cut for 4pm:** Steve unavailable; demo uses **labeled fixture** at `/saved`. If Keyan has slack **after** A+B:

Per `supabase/INTEGRATION_HANDOFF.md`:

- `listOwnApplications()`, `saveApplication(jobId)`, `updateApplication(id, patch)`, `removeApplication(id)` with authorized job summaries (paused/hidden rules per AGENTS.md).

Steve owns `src/app/api/applications/**` when built.

---

## 3. Fictional Student A / B (for isolation tests)

Provision **two ordinary student accounts** (no credentials in Git). Document setup in Keyan's handoff only; store secrets in:

- Local: `.env.local` (gitignored)
- CI / Vercel: project settings

**Variable names** (from AGENTS.md / existing guarded E2E):

- `E2E_STUDENT_A_EMAIL`, `E2E_STUDENT_A_PASSWORD`
- `E2E_STUDENT_B_EMAIL`, `E2E_STUDENT_B_PASSWORD`

Guarded spec (already in repo): `tests/e2e/dallas-private-jobs-db.spec.ts` — `test.skip` until `SUPABASE_URL` + both pairs are set. Do **not** post passwords in PR comments.

---

## 4. Environment variable **names** (no values in Git)

From `.env.example` + README + deploy needs:

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + local | Browser/session client (anon/publishable) |
| `SUPABASE_SECRET_KEY` or documented service-role name | Server only, Vercel | Narrow admin/setup only — **not** in browser bundle |
| `ANTHROPIC_API_KEY` | Server only | Résumé/prep generation (optional until those routes enabled) |
| `CLAUDE_MODEL` | Server only | Model id |
| `JOB_SEARCH_PROVIDER` | Server only | `claude_web` or `none` (single selector) |
| `APP_URL` | Server / auth redirects | Callback allowlists |
| `E2E_STUDENT_A_EMAIL` / `PASSWORD` | CI/local test only | Fictional Student A |
| `E2E_STUDENT_B_EMAIL` / `PASSWORD` | CI/local test only | Fictional Student B |

**Vercel:** Dallas/Keyan create project, attach env vars, confirm auth redirect URLs. **No values in repository.**

---

## 5. Employer journey

**Proposed cut for 4pm MVP:** no `src/app/employer/**` build today unless explicitly unparked after student path is green.

---

## 6. Ready-for-Keyan checklist (human)

When Keyan sits down:

1. Confirm migrations applied on target Supabase project.
2. Implement + export **`src/lib/data/jobs.ts`** (`createPrivateJobImport`, `getAuthorizedJob`).
3. Implement résumé adapters (or scoped RPC) for suggest/save/edit path.
4. Provision Student A/B; share env var **names** and where values live (not in chat logs if avoidable).
5. Pair with Dallas on **Vercel env + deploy**; then Antigravity/Cursor run [core-at-12-runbook.md](core-at-12-runbook.md).