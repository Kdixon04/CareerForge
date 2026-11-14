# Core-at-12 enablement runbook (mechanical)

**Run ONLY after** Keyan's adapters are merged and reviewed. **Never** flip client flags on mocks, open PRs alone, or unguarded tests.

**Base:** `main` at or after `c35702c` (inert import/read routes on `main`).  
**Owner sequence:** Keyan (adapters) → Antigravity (route wiring + résumé routes) → Cursor (UI flags + match wire) → deploy smoke.

---

## Phase 0 — Preconditions

- [ ] `src/lib/data/jobs.ts` exports `createPrivateJobImport`, `getAuthorizedJob` (user-scoped, RLS).
- [ ] Résumé data path exists if résumé MVP is in scope for demo.
- [ ] Vercel project + Supabase env vars set (see [keyan-ask.md](keyan-ask.md)).
- [ ] Student A/B accounts provisioned; E2E env vars set locally/CI if running isolation spec.

---

## Phase 1 — Private pasted job (Antigravity + Cursor)

### 1a. Route wiring (Antigravity)

**`src/app/api/jobs/import/route.ts`**

```ts
import { createPrivateJobImport } from '../../../../lib/data/jobs';
// ...
export async function POST(request: NextRequest): Promise<Response> {
  return handleImportJob(request, { adapter: { createPrivateJobImport } });
}
```

**`src/app/api/jobs/[id]/route.ts`**

```ts
import { getAuthorizedJob } from '../../../../lib/data/jobs';
// ...
export async function GET(...) {
  const { id } = await params;
  return handleGetJob(id, { adapter: { getAuthorizedJob } });
}
```

### 1b. UI gate (Cursor — separate PR after routes verified)

**`src/app/(student)/jobs/job-api-client.ts`**

```ts
export const IS_JOB_PERSISTENCE_AVAILABLE = true;
```

Only after:
- Adapter merged
- Routes wired and returning real `{ data: JobPosting }` for authenticated import/read
- Manual or E2E: Student A save → detail → reload; Student B GET → 404

### 1c. Verification commands

```powershell
npm run typecheck
npm test
npm run build
$env:CAREERFORGE_E2E_JOBS_FIXTURE='0'  # live mode when creds exist
# Optional: run guarded tests/e2e/dallas-private-jobs-db.spec.ts with live env
npm run smoke -- --grep dallas-jobs
```

**Security:** Student B must not read Student A private job id (404, no existence leak). Re-run `supabase/security_checks.ps1` or equivalent if adapters change RLS.

---

## Phase 2 — Résumé suggest / edit / reload (Antigravity + Cursor)

**Routes (Antigravity)** — per AGENTS.md:

| Route | Body | Success |
|-------|------|---------|
| `POST /api/resume/suggest` | `{ jobId }` | `{ data: ResumeVersion }` |
| `GET /api/resume/[id]` | — | `{ data: ResumeVersion }` |
| `PATCH /api/resume/[id]` | `{ editedBullets }` | `{ data: ResumeVersion }` |

Use `generateResumeSuggestions` from `src/lib/claude/resume-suggest.ts` with **mocked** `modelCaller` in unit tests; require **consent** + `ANTHROPIC_API_KEY` for live.

**Keyan adapters:** `createResumeVersion`, `getOwnResumeVersion`, `updateOwnResumeEdits` (see [keyan-ask.md](keyan-ask.md)).

**Cursor (when routes live):** wire `/match/[id]` to load/save real `ResumeVersion` (add `IS_RESUME_PERSISTENCE_AVAILABLE` gate mirroring `job-api-client.ts` if not already present). Enable match save button when `PATCH` works; reload must retain edits.

**Verification:** suggest → edit bullets → PATCH → reload → edited text retained; evidence still shows snapshot facts.

---

## Phase 3 — Prep hub (STRETCH — lowest priority)

- Cursor: `IS_PREP_LIVE` in `src/app/(student)/jobs/prep-hub.ts` stays **`false`** until Antigravity `src/app/api/prep/**` routes are merged, fail-closed, and CI green.
- Antigravity: questions/buzzwords/news only; **no contacts API** (see [stretch-prep-hub.md](stretch-prep-hub.md) on PR #45).
- Never enable live prep ahead of Phase 1–2 unless core is already demo-ready.

---

## Phase 4 — Deployed smoke (after Vercel env)

**NOT RUN** until deploy exists. When available:

1. Signed out → sign in (Student A)
2. Profile: edit facts → save → reload (real)
3. `/jobs`: browse published list + filters (real if DB has rows; else document)
4. Paste → preview (parse real); save private if Phase 1 done
5. Match: fixture OR real résumé if Phase 2 done — label honestly
6. `/saved`, `/calendar`: **fixture** unless applications adapter shipped
7. `/jobs/[id]/prep`: **fixture** until `IS_PREP_LIVE`

Record **real vs fixture** in `teammates.md` for Will's video script (Will owns `demo/**`).

---

## Phase 5 — Scope cuts (proposed — confirm with human/Keyan)

| Journey | 4pm default |
|---------|-------------|
| Profile save/reload | **Real** (target) |
| Published browse/detail | **Real** (target) |
| Private paste save | **Real** if Phase 1 completes |
| Résumé suggest/edit/reload | **Real** if Phase 2 completes; else fixture match |
| Saved applications status | **Fixture** (Steve out) |
| Employer post/analytics | **Cut** |
| Prep hub live | **Stretch / fixture** |

---

## Flag discipline

| Flag | File | When `true` |
|------|------|-------------|
| `IS_JOB_PERSISTENCE_AVAILABLE` | `job-api-client.ts` | After import/GET live + verified |
| `IS_RESUME_PERSISTENCE_AVAILABLE` | (add when match client lands) | After résumé HTTP + adapter verified |
| `IS_PREP_LIVE` | `prep-hub.ts` (PR #45) | After prep routes + consent verified |

**Never** set flags in the same commit as adapter stubs or mocked-only tests.