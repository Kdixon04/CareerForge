# Cursor ↔ Antigravity / Dallas handoff

**Updated:** 2026-11-14 (interim: Cursor acting as integrator while Codex is out of tokens until ~2:00pm Denver) · **main** at `60d23d6` (auth, profile adapter #31, published jobs adapter #32, calendar #41, filters #42, private-job handler logic #40).

Cursor owns `src/app/(student)/jobs/**` and `match/**`. Cursor does **not** edit `src/app/api/**`, `src/lib/jobs/**` (except consuming types), `src/lib/supabase/**`, or contracts.

---

## Finish-by-4pm plan (Denver, 2026-11-14)

Codex (integration + contracts/config) is paused until ~2:00pm; Cursor is acting as the single interim integrator with human authorization. Target: a working, truthful demo + submission by 4:00pm.

- **Done this session:** merged #41 (calendar), #42 (published-jobs filters), #40 (private-job handler logic, fail-closed). Local main green: typecheck, unit (138/138), build, Dallas Playwright 36/36 at 390/1280 in light+dark (fixture mode).
- **Real vs fixture for the demo:**
  - **Real (needs live Supabase env):** sign-in, profile save/load (#31), published job browse/detail (#32).
  - **Fixture / clearly labeled preview:** match review (`/match/[id]`), saved applications, calendar — all fictional, no persistence claim.
  - **Not enabled:** private pasted-import save→detail→reload (fail-closed; see below). Résumé suggest/read/edit HTTP routes.
- **Deployed smoke:** **NOT RUN** — no Vercel project or GitHub deployment is configured in this repo and no Supabase credentials are available locally. Do not invent deployed credentials. Local production `build` passes; fixture-mode Playwright passes. A real deployed journey requires Keyan's Supabase env + a configured Vercel project.
- **For Codex at 2pm:** apply the Windows Playwright `webServer` config fix (see "Resolved teammate comment"); integrate résumé routes when Antigravity + Keyan land them; take over integration.

---

## Resolved teammate comment — Will's Windows Playwright `webServer` hang

Will (`wkslade`) asked on [PR #7](https://github.com/Kdixon04/CareerForge/pull/7#issuecomment-6881748881) to investigate the shared Playwright `webServer` teardown hanging on Windows (port 3000 stays held after the browser closes; all 8 calendar cases pass with a prestarted server). **Root cause:** `webServer.command: 'npm run start'` + `reuseExistingServer: false` — on teardown Playwright kills the `npm` wrapper but the grandchild `next`/node process is not reaped on Windows, and `reuseExistingServer: false` forces Playwright to always manage the server so a prestarted one is never reused. CI on `ubuntu-latest` is unaffected.

**Proposed fix (owner: Codex — `playwright.config.ts` is Codex's config slice, currently paused; Cursor did NOT edit it):**

```ts
webServer: {
  command: 'node_modules/.bin/next start',   // drop npm wrapper so Windows tree-kill targets next
  url: 'http://127.0.0.1:3000',
  reuseExistingServer: !process.env.CI,       // locally reuse a prestarted server; CI still manages it
  timeout: 120_000,
},
```

Replied on the thread with this diagnosis + patch and flagged for Codex to apply at 2pm. No calendar-test change is needed; Will did not change `playwright.config.ts`.

---

## Working today (not Cursor-owned)

| Capability | How | Cursor UI |
|------------|-----|-----------|
| Sign-in | Supabase auth + middleware | Users must sign in for live job browse |
| Profile save/load | `GET/PUT /api/profile` + Keyan adapter (#31) | Steve’s `/profile` |
| **Published job browse/detail** | `listPublishedJobs` / `getPublishedJob` in `src/lib/jobs/job-adapter.ts` (Supabase RLS, `status=published`, `source=employer`) | `/jobs` list + `/jobs/[id]` when **not** in `CAREERFORGE_E2E_JOBS_FIXTURE=1` |
| Parse preview | `POST /api/jobs/parse` | `PasteJobForm` → `submitPasteJob` |

**Fixture CI:** `CAREERFORGE_E2E_JOBS_FIXTURE=1` (see `.github/workflows/ci.yml`) swaps list/detail to `exampleJob` + `findFixtureJob` so Playwright does not require live Supabase rows.

**Still missing:** `POST /api/jobs/import`, `GET /api/jobs/[id]` HTTP route files under `src/app/api/jobs/` (Antigravity), and Keyan's user-scoped adapter `src/lib/data/jobs.ts` (`createPrivateJobImport`, `getAuthorizedJob`). Handler **logic** landed on main via #40 (`src/lib/jobs/private-job-handlers.ts`) but is **fail-closed** (503 without an adapter) and not wired to any route yet.

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

**Status 2026-11-14:** handler logic merged (#40) as `src/lib/jobs/private-job-handlers.ts` + 19 tests — dependency-injected, `readBoundedBody` (100KB), auth via `getUser()`, server/RLS-derived provenance, indistinguishable 404 isolation, **fail-closed 503 when no adapter**. Next: Keyan publishes `src/lib/data/jobs.ts`; Antigravity wires `src/app/api/jobs/import/route.ts` and `src/app/api/jobs/[id]/route.ts` to call `handleImportJob` / `handleGetJob`; only then does Cursor flip the persistence flag (never on mocks).

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
- **#27** (this handoff + gated save UI) merged — import/read prep only.
- **#41** calendar integration merged (auto-merged original **#7**).
- **#42** published-jobs client-side filters merged (keyword/type/work-mode on the already-loaded list; no search/Claude claim).
- **#40** private-job handler logic merged (fail-closed, routes pending).
- **#35** (Steve adapter prep) left as DRAFT — not integrated.

Requested by: Cursor, 2026-11-14