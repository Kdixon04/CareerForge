# Vercel + Supabase deploy checklist (Dallas + Keyan)

**Purpose:** Get a deployed URL for demo smoke and Will’s video **without putting secrets in Git**.  
**Status:** Deploy smoke **NOT RUN** until a human completes every step below.  
**Codebase base:** `main` at or after `38510cb` (prep #45 + #47 merged; `src/lib/data/**` still pending Keyan).

Human operators paste values only in **local `.env.local`** and the **Vercel / Supabase dashboards**—never in PRs, chat logs, or this file.

---

## Roles

| Step | Dallas (human) | Keyan |
|------|----------------|-------|
| Vercel project + Git link | Primary | Confirm env names match Supabase project |
| Copy env vars from `.env.local` → Vercel | Primary | Supply publishable URL/key if Dallas lacks dashboard access |
| Supabase Auth URL config | Mirror `APP_URL` + Vercel hostnames | Primary (dashboard) |
| Apply migrations | Trigger deploy after Keyan confirms DB | Primary (CLI or SQL) |
| Seed published job(s) | Verify `/jobs` after deploy | Primary (SQL, fictional data only) |
| Post-deploy smoke | Primary | On-call for RLS/seed issues |

---

## Phase 1 — Local `.env.local` (human only)

1. Copy template: `Copy-Item .env.example .env.local`
2. Fill values from **Supabase Dashboard → Project Settings → API** and **Anthropic Console** (if using generation later).
3. Keep `.env.local` gitignored.

---

## Phase 2 — Vercel: new project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import `Kdixon04/CareerForge` (or the team’s fork).
2. Framework: **Next.js** (defaults). Root directory: repository root.
3. **Do not** paste env values into `vercel.json` or the repo.
4. Before first production deploy, add environment variables (Phase 3).

---

## Phase 3 — Mirror env var **names** (values from `.env.local` only)

In **Vercel → Project → Settings → Environment Variables**, create each name for **Production** and **Preview** (and Development if you use Vercel dev). Copy the **value** from your local `.env.local`—do not invent keys.

### Required for auth + database (app + browser)

| Variable name | Notes |
|---------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon / publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same value as publishable key (E2E header name) |

### Required for server routes / redirects

| Variable name | Notes |
|---------------|--------|
| `APP_URL` | Production: `https://<your-production-host>` (no trailing slash). Preview: also set per-preview or use Vercel’s production URL for first smoke. |
| `SUPABASE_URL` | Usually same host as `NEXT_PUBLIC_SUPABASE_URL` (no trailing slash); used by guarded DB E2E |

### AI (optional until résumé/prep routes are enabled on deploy)

| Variable name | Notes |
|---------------|--------|
| `ANTHROPIC_API_KEY` | Server-only |
| `CLAUDE_MODEL` | Team-agreed model id |
| `JOB_SEARCH_PROVIDER` | Use `none` for demo unless live search is smoke-tested |

### Optional server-only

| Variable name | Notes |
|---------------|--------|
| `SUPABASE_SECRET_KEY` | Only if a privileged server path is implemented; never `NEXT_PUBLIC_` |

### CI / local E2E only (optional on Vercel until running live isolation tests)

| Variable name | Notes |
|---------------|--------|
| `E2E_STUDENT_A_EMAIL` | Fictional account |
| `E2E_STUDENT_A_PASSWORD` | Fictional account |
| `E2E_STUDENT_B_EMAIL` | Fictional account |
| `E2E_STUDENT_B_PASSWORD` | Fictional account |

### Playwright fixture mode

| Variable name | Notes |
|---------------|--------|
| `CAREERFORGE_E2E_JOBS_FIXTURE` | Omit or `0` on deploy for real published rows; `1` in CI fixture mode |
| `CAREERFORGE_E2E_PROFILE_FIXTURE` | Omit or `0` when profile adapter is live |

**Checklist:** Every non-empty key in `.env.local` that the app reads should exist in Vercel with the **same name**.

---

## Phase 4 — Supabase Auth URL configuration (Keyan + Dallas verify)

In **Supabase Dashboard → Authentication → URL configuration**:

1. **Site URL:** Set to the primary demo URL (`APP_URL` production value, or the Vercel production domain once known).
2. **Redirect URLs** (add all that apply):
   - `http://127.0.0.1:3000/**` (local dev)
   - `http://localhost:3000/**`
   - `https://<production-domain>/**`
   - `https://*.vercel.app/**` (preview deployments; confirm org policy allows wildcard)

3. Confirm email auth is enabled for demo accounts (or use pre-provisioned fictional users).

4. After changing URLs, redeploy Vercel or wait for the next build so server and browser use consistent hosts.

---

## Phase 5 — Apply migrations (Keyan)

Apply **both** files in order to the **same** Supabase project wired in Vercel:

| Order | File | Migration id |
|-------|------|----------------|
| 1 | `supabase/migrations/20261113200000_career_forge_initial.sql` | `20261113200000` |
| 2 | `supabase/migrations/20261114091500_security_integrity_fixes.sql` | `20261114091500` |

### Option A — Supabase CLI (preferred when linked)

```powershell
# From repo root; requires Supabase CLI and project link (human runs interactively)
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

Verify in Dashboard → **Database → Migrations** that both ids appear.

### Option B — SQL Editor (if CLI unavailable)

1. Open each migration file in the repo (in order).
2. Run the full contents in **SQL Editor** on a non-production test project first if possible; then on the demo project.
3. Record applied ids in Keyan’s handoff.

**Do not** reset production or re-run blindly without confirming current migration state (`supabase/INTEGRATION_HANDOFF.md`).

---

## Phase 6 — Seed at least one **published** employer job (Keyan)

`/jobs` should list **real database rows** when `CAREERFORGE_E2E_JOBS_FIXTURE` is not forcing fixtures. Use **fictional** company and description only.

### Prerequisites (trusted SQL / dashboard setup)

1. **Fictional employer auth user** exists (e.g. demo employer account—not a real company).
2. `user_roles` row: `role = 'employer'` for that user (trusted setup; not client-writable).
3. `employers` row: `owner_user_id` = that user’s UUID, `company_name` = fictional (e.g. `Ridgeview Labs (Demo)`).

### Job row outline

Insert into `public.jobs` with server-controlled fields:

- `source` = `'employer'`
- `employer_id` = the fictional employer’s `employers.id`
- `created_by_user_id` = same owner user id
- `status` = `'published'`
- `title`, `company`, `description` = fictional internship copy (within length checks in migration)
- `job_type` / `work_mode` = valid enum strings (e.g. `internship`, `hybrid`)
- `deadline_verified` = `false`, `verification_status` = `'unverified'`
- `provider_name`, `external_id` = null unless using a provider identity

Example **shape** (replace UUIDs with values from your project; run as Keyan in SQL Editor):

```sql
-- After employers row exists for fictional demo employer:
insert into public.jobs (
  title, company, description, location,
  job_type, work_mode, source, status,
  created_by_user_id, employer_id,
  deadline_verified, verification_status
) values (
  'Software Intern — Demo Listing',
  'Ridgeview Labs (Demo)',
  'Fictional posting for Career Forge hackathon demo. Students browse published employer jobs; this text is not a real opening.',
  'Rexburg, ID',
  'internship', 'hybrid', 'employer', 'published',
  '<OWNER_USER_UUID>', '<EMPLOYER_UUID>',
  false, 'unverified'
);
```

**Dallas verification:** After deploy, sign in as a **student** and open `/jobs`—the listing should appear when fixture mode is off.

Optional: second published row or a `draft` row owned by another employer to confirm RLS (see `supabase/SECURITY_CHECKS.md`).

---

## Phase 7 — Deploy on Vercel (Dallas)

1. Merge adapter PRs per schedule; trigger **Production** deploy from `main` (or deploy preview first).
2. Set `APP_URL` to the URL you will smoke-test (update if using production domain vs first `.vercel.app` URL).
3. Re-check Supabase redirect allowlist includes that host.

**Do not** claim deploy smoke passed until Phase 8 is complete.

---

## Phase 8 — Post-deploy smoke (Dallas; ~5 minutes)

Use a **fictional student account** (create in Supabase Auth if needed). Mobile width (390px) optional but recommended once for Will.

| # | Step | Pass criteria | Truth label (for Will) |
|---|------|---------------|-------------------------|
| 1 | Open deployed `/sign-in` | Page loads; sign-in succeeds | **REAL** when env set |
| 2 | `/profile` | Add 2–3 facts; save; hard reload; data still there **if** profile adapter merged | **REAL** when adapter + env; else note fixture |
| 3 | `/jobs` | At least one published listing visible (seeded) or honest empty state | **REAL** when DB seeded |
| 4 | Optional | Open one job detail `/jobs/[id]` | **REAL** for published row |
| 5 | Optional | Paste job form shows parse preview; private save may still be **off** until `src/lib/data/jobs.ts` + flag flip | Parse **REAL**; save per teammates table |

Record in `teammates.md`: deploy URL, smoke **PASS/FAIL**, commit SHA, and any step still fixture.

**Ping Will** when steps 1–3 pass with URL + [demo truth table](../teammates.md).

---

## References

- Env template: [`.env.example`](../.env.example)
- Keyan adapter priority: [`keyan-ask.md`](keyan-ask.md)
- Flag flip sequence: [`core-at-12-runbook.md`](core-at-12-runbook.md)
- RLS checks: [`supabase/SECURITY_CHECKS.md`](../supabase/SECURITY_CHECKS.md)