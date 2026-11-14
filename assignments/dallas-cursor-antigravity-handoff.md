# Cursor ↔ Antigravity / Dallas handoff

**Updated:** 2026-11-14 · **main** at `1ab45e6` (includes auth, profile adapter #31, published jobs adapter #32)

Cursor owns `src/app/(student)/jobs/**` and `match/**`. Cursor does **not** edit `src/app/api/**`, `src/lib/jobs/**` (except consuming types), `src/lib/supabase/**`, or contracts.

---

## Working today (not Cursor-owned)

| Capability | How | Cursor UI |
|------------|-----|-----------|
| Sign-in | Supabase auth + middleware | Users must sign in for live job browse |
| Profile save/load | `GET/PUT /api/profile` + Keyan adapter (#31) | Steve’s `/profile` |
| **Published job browse/detail** | `listPublishedJobs` / `getPublishedJob` in `src/lib/jobs/job-adapter.ts` (Supabase RLS, `status=published`, `source=employer`) | `/jobs` list + `/jobs/[id]` when **not** in `CAREERFORGE_E2E_JOBS_FIXTURE=1` |
| Parse preview | `POST /api/jobs/parse` | `PasteJobForm` → `submitPasteJob` |

**Fixture CI:** `CAREERFORGE_E2E_JOBS_FIXTURE=1` (see `.github/workflows/ci.yml`) swaps list/detail to `exampleJob` + `findFixtureJob` so Playwright does not require live Supabase rows.

**Still missing:** `POST /api/jobs/import`, `GET /api/jobs/[id]` HTTP routes for **private** pasted imports (Antigravity + Keyan). No import/read API files under `src/app/api/jobs/` yet.

---

## Three job states in the UI (must stay distinct)

| State | What it is | User action | Detail route today |
|-------|------------|-------------|-------------------|
| **Parse preview** | Ephemeral `JobPosting` from parse; random `id`; **not in DB** | Preview pasted job | **Do not** link to `/jobs/{preview.id}` — published detail cannot load it |
| **Saved private import** | Persisted `source=pasted`, `status=private` (future) | Save as private job (blocked) | Future: `GET /api/jobs/[id]` + detail copy “Private import” |
| **Published employer job** | DB row, RLS-visible | Open job detail from list | `getPublishedJob` on server |

Match review (`/match/[id]`) remains **fixture-only** until résumé routes land.

---

## Blocked: private import/read (Antigravity)

### `POST /api/jobs/import`

- **Auth:** verified session; server sets `createdByUserId`; reject anonymous.
- **Body:** `JobDraft` (same fields as parse).
- **200:** `{ data: JobPosting }` with `source: "pasted"`, `status: "private"`, `deadlineVerified: false`, server `id`, timestamps.
- **400:** `{ error: { code: "INVALID_INPUT", message: string } }`
- **401:** `{ error: { code: "UNAUTHENTICATED", message: string } }`
- **403:** `{ error: { code: "FORBIDDEN", message: string } }`
- **503:** `{ error: { code: "SERVICE_UNAVAILABLE", message: string } }`

### `GET /api/jobs/[id]`

- **Auth:** session; RLS per AGENTS.md (own private paste, published employer, saved paused listing rules).
- **200:** `{ data: JobPosting }`
- **401 / 403 / 404:** `{ error: { code, message } }` — no cross-user existence leak.

**Cursor enablement (separate PR after merge):** set `IS_JOB_PERSISTENCE_AVAILABLE = true` in `src/app/(student)/jobs/job-api-client.ts`; wire Save → navigate → server detail merge (authorized private + existing published path). E2E with **real** `E2E_STUDENT_A_*` / `E2E_STUDENT_B_*` for reload + isolation (**NOT RUN** until routes + CI secrets).

**Client prep on PR #27:** `job-api-client.ts` with `IS_JOB_PERSISTENCE_AVAILABLE = false` — **no fetch** to import/GET when false (unit tests use **mocked** fetch only; not proof of persistence).

---

## Résumé (after private import/read)

| Route | Request | Success |
|-------|---------|---------|
| `POST /api/resume/suggest` | `{ jobId }` | `{ data: ResumeVersion }` |
| `GET /api/resume/[id]` | — | `{ data: ResumeVersion }` |
| `PATCH /api/resume/[id]` | `{ editedBullets: [{ id, text }] }` | `{ data: ResumeVersion }` |

---

## Historical

- Cursor **#20** / **#24** merged; **#16** closed redundant.
- **#27** (this handoff + gated save UI) open — import/read prep only.

Requested by: Cursor, 2026-11-14