# Career Forge team handoff

Read [AGENTS.md](AGENTS.md) and your own assignment: [Dallas](assignments/dallas.md), [Keyan](assignments/keyan.md), [Steve](assignments/steve-rogers.md), or [Will](assignments/will.md). AGENTS.md controls shared rules and path ownership; assignments control individual work. Dallas edits shared coordination decisions here. Other agents propose updates in their handoffs rather than editing this file concurrently.

## Verified state

At this handoff, CareerForge `main` is `f6702ca`: coordination PR [#3](https://github.com/Kdixon04/CareerForge/pull/3) and Steve's visual/profile work from PRs [#4](https://github.com/Kdixon04/CareerForge/pull/4) and [#9](https://github.com/Kdixon04/CareerForge/pull/9) are merged. The [main CI run](https://github.com/Kdixon04/CareerForge/actions/runs/43568833937) passed on that exact commit. Will's calendar PR [#7](https://github.com/Kdixon04/CareerForge/pull/7) was still open when checked on November 14, 2026; recheck current PR/main status before integrating. Pull current `main` before creating a feature branch.

Main has a Next.js landing page, provisional [contracts](src/contracts/), [fictional examples](src/data/examples.ts), and Steve's `/profile` editing preview. That profile uses fictional data and **does not persist**; the full student/employer journeys are still planned. The verified main CI checks do not prove auth, persistence, security, or live search. Zod 3 remains under advisory: upgrade and revalidate contracts **before** parsing external API requests; do not claim the audit is clean.

**Ownership exception:** Steve unavailable 2026-11-14; Dallas patched MainNav, root-shell wiring, and steve-shell.spec.ts rebase. The AGENTS.md ownership table still stands for all future work.

**Integration status — 2026-11-14 (~1:20 Denver):** `main` at `38510cb`. Prep hub UI (#45) and inert prep API routes (#47) merged (fixture / fail-closed). Prior student-path merges include #44 import/read, filters #42, calendar #41, handlers #40. **`src/lib/data/**` not on main yet** — blocking private job persistence, profile save, and résumé adapters ([keyan-ask.md](assignments/keyan-ask.md)). **Deployed smoke: NOT RUN** until a human completes [vercel-supabase-deploy-checklist.md](assignments/vercel-supabase-deploy-checklist.md) (no secrets in Git).

**Next 90 minutes (by owner):**

- **Dallas:** Human runs deploy checklist with Keyan; mirror `.env.local` → Vercel; merge Keyan `src/lib/data` PR when green; post-deploy smoke (sign-in → profile → `/jobs`); ping Will with URL + [WILL-VIDEO-SCRIPT.md](demo/WILL-VIDEO-SCRIPT.md).
- **Keyan:** Confirm migrations `20261113200000` + `20261114091500` on demo Supabase; seed ≥1 fictional **published** employer job; ship **`src/lib/data/jobs.ts`** first, profile second, résumé if slack; Supabase Auth redirect URLs for `APP_URL` + Vercel hosts.
- **Steve (Dallas nav patch):** Shared student nav (Profile, Jobs, Saved, Calendar) on all student routes; job detail → Match/Prep CTAs; mobile/light-dark pass on profile + jobs.
- **Will:** Lock narration from demo table below; record after deploy smoke ~2:30; fictional student only; label FIXTURE rows on screen.
- **Antigravity / Codex:** Wire import/GET when `jobs.ts` lands; résumé routes when adapter exists; integrator merges only—no env invention.

**Proposed scope for 4pm (confirm with human/Keyan):** saved-application **persistence CUT** → labeled fixture on `/saved` (Steve unavailable); **employer journey CUT**; Keyan prioritizes `src/lib/data/jobs.ts` + résumé adapters, then deploy env. Private import + résumé reload are **stretch-to-core** if adapters land in time.

**Verified demo journey reference (for Will's video — do not claim persistence where marked fixture):**

| Step | Route | Expected truth label |
|------|--------|----------------------|
| Sign in | `/sign-in` | Real when Supabase env set |
| Profile save/reload | `/profile` | **Real** when adapter + env (target) |
| Browse + filters | `/jobs` | **Real** published rows when DB seeded; CI uses fixture env |
| Job detail | `/jobs/[id]` | **Real** or fixture per env |
| Paste preview | `/jobs` form | **Real** parse; save private **off** until flag flip |
| Match / résumé edit | `/match/[id]` | **Fixture** until résumé routes + adapter |
| Saved applications | `/saved` | **Fixture** (proposed cut) |
| Calendar | `/calendar` | **Fixture** sample schedule |
| Prep hub | `/jobs/[id]/prep` | **Fixture** (PR #45, `IS_PREP_LIVE` false) |

## Owners and next handoffs

- **Dallas:** foundation, shared contracts/config, jobs/résumé flow and integration. Give Cursor and Antigravity a stable contract and integrate tested slices. Dallas coordinates shared changes; Codex is his designated writer for contracts/config, and Dallas updates this handoff.
- **Keyan:** Supabase schema, RLS, adapters, security, and employer features. Confirm student/fact ID and storage shape (relational rows versus JSON), job verification/lifecycle, and résumé persistence/source-fact links. Send Dallas and Steve the exact confirmed fields, adapter names/signatures, migration state, and test results before they wire routes.
- **Steve:** profile/saved-application UI and routes, theme/navigation. His profile preview is fixture-backed; hand Dallas the component/provider props for the root shell and send Keyan exact adapter needs before real saving.
- **Will:** mobile-friendly in-app calendar for internship deadlines and personal reminders, upcoming in-app reminder states, Google Calendar event links/ICS exports, and (after Keyan's secure contact-data handoff) private professional contacts, meeting notes, and editable follow-up suggestions. Own demo/video and independent QA as well. Request saved-page/nav wiring from Steve and data adapters from Keyan; give owners reproducible findings and mark each demo claim built, fallback, planned, or cut.

Immediate MVP target: profile facts → paste a job → generate evidence-linked résumé suggestions → review/edit → save the next step. That journey is **planned**, not working yet. Live job search follows only after the pasted-job journey works. The calendar deadline/reminder view and external exports can proceed independently; persistent contact follow-ups depend on a private contacts schema and adapter. Background delivery and two-way calendar sync remain later work. Do not change another owner's files; request exact cross-owner changes in a handoff. No credentials or real student data in handoffs.

Handoff format: **owner; changed paths; contract changes requested or made; checks actually run and results (or NOT RUN with reason); blocker; next owner/action.**
