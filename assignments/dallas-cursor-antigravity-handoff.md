# Cursor ↔ Antigravity / Dallas handoff

**Status on `main` (2026-11-14):** Cursor slice **#20** and CI fix **#24** are merged at `8964410`. Fixture job detail (`/jobs/[id]`), match review (`/match/[id]`), and paste UI are on `main`. **No** `POST /api/jobs/import` or `GET /api/jobs/[id]` routes exist yet (only `POST /api/jobs/parse`).

Cursor owns student UI in `src/app/(student)/jobs/**` and `match/**`. Cursor does **not** edit `src/app/api/**`, `src/lib/jobs/**` adapters, or `src/contracts/**`.

---

## Live today

| Route | Request | Success | Errors (body) |
|-------|---------|---------|----------------|
| `POST /api/jobs/parse` | JSON `JobDraft` fields | `{ data: JobPosting }` preview (not persisted; ephemeral `id`) | `400` `{ error: { code, message } }` |

Consumer: `PasteJobForm` → `submitPasteJob` (`IS_PARSE_ROUTE_MERGED = true` on main).

---

## Blocked: what Cursor needs to replace fixture job detail

### `POST /api/jobs/import` (Antigravity + Keyan adapter)

| | |
|---|---|
| **Auth** | Session cookie; server derives `createdByUserId` from verified session — **never** accept client `userId`. |
| **Body** | `JobDraft`: `{ title, company, description, location, jobType, workMode, sourceUrl, deadline }` (same shape parse validates). |
| **Success `200`** | `{ data: JobPosting }` with server-set `id`, `source: "pasted"`, `status: "private"`, `deadlineVerified: false`, `employerId: null`, timestamps, `createdByUserId` = caller. |
| **`400`** | `{ error: { code: "INVALID_INPUT", message: string } }` |
| **`401`** | `{ error: { code: "UNAUTHENTICATED", message: string } }` |
| **`403`** | `{ error: { code: "FORBIDDEN", message: string } }` (wrong role if applicable) |
| **`503`** | `{ error: { code: "SERVICE_UNAVAILABLE", message: string } }` adapter/DB unavailable — generic message, no stack trace |

**Cursor behavior after merge:** explicit **“Save as private job”** after parse preview; on success navigate to `/jobs/{data.id}`; UI labels **saved private import**, still **unverified** deadline/opening.

### `GET /api/jobs/[id]` (Antigravity + Keyan authorized read)

| | |
|---|---|
| **Auth** | Session cookie; RLS — caller may read own `private` pasted job, published employer jobs they’re allowed to see, etc. (per AGENTS.md). |
| **Success `200`** | `{ data: JobPosting }` |
| **`401`** | `{ error: { code: "UNAUTHENTICATED", message: string } }` |
| **`403`** | `{ error: { code: "FORBIDDEN", message: string } }` |
| **`404`** | `{ error: { code: "NOT_FOUND", message: string } }` — must not leak private resources owned by others |

**Cursor behavior after merge:** `/jobs/[id]` uses authorized fetch first; **fixture example** remains only for the labeled example card link (`exampleJob.id`). Detail copy distinguishes **saved private import** vs **fictional example**.

### Dallas / Keyan signals Cursor will watch for

1. PR or handoff naming the import/read routes merged and adapter ready in dev/CI.
2. Cursor sets `IS_JOB_PERSISTENCE_AVAILABLE = true` in `src/app/(student)/jobs/job-api-client.ts` (Cursor-owned) after smoke against real auth.
3. E2E credentials: `E2E_STUDENT_A_EMAIL` / `PASSWORD` for reload persistence test — **NOT RUN** until routes + env on CI.

---

## Résumé routes (next after import/read slice)

| Route | Request | Success |
|-------|---------|---------|
| `POST /api/resume/suggest` | `{ jobId }` | `{ data: ResumeVersion }` |
| `GET /api/resume/[id]` | — | `{ data: ResumeVersion }` |
| `PATCH /api/resume/[id]` | `{ editedBullets: [{ id, text }] }` | `{ data: ResumeVersion }` |

Match UI today: `/match/[jobId]` + fixtures. After suggest exists: confirm with Dallas whether URL stays job-scoped or becomes `/match/[resumeVersionId]`.

---

## Honesty (both sides)

- Parse preview ≠ saved job; UI must not imply otherwise.
- No client-supplied `source`, `status`, `deadlineVerified`, or ownership fields.
- No ATS / match % / “verified open” copy.

---

## Historical (obsolete — do not follow)

~~PR merge order #16 / #20~~ — **#16 closed redundant**; **#20 merged** (`938da52`); **#24** test fix merged (`8964410`).

Requested by: Cursor, 2026-11-14 (updated after merge reconciliation)