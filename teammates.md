# Career Forge team handoff

Read [AGENTS.md](AGENTS.md) and your own assignment: [Dallas](assignments/dallas.md), [Keyan](assignments/keyan.md), [Steve](assignments/steve-rogers.md), or [Will](assignments/will.md). AGENTS.md controls shared rules and path ownership; assignments control individual work. Dallas edits shared coordination decisions here. Other agents propose updates in their handoffs rather than editing this file concurrently.

## Verified state

At this handoff, CareerForge `main` is `f6702ca`: coordination PR [#3](https://github.com/Kdixon04/CareerForge/pull/3) and Steve's visual/profile work from PRs [#4](https://github.com/Kdixon04/CareerForge/pull/4) and [#9](https://github.com/Kdixon04/CareerForge/pull/9) are merged. The [main CI run](https://github.com/Kdixon04/CareerForge/actions/runs/43568833937) passed on that exact commit. Will's calendar PR [#7](https://github.com/Kdixon04/CareerForge/pull/7) was still open when checked on November 14, 2026; recheck current PR/main status before integrating. Pull current `main` before creating a feature branch.

Main has a Next.js landing page, provisional [contracts](src/contracts/), [fictional examples](src/data/examples.ts), and Steve's `/profile` editing preview. That profile uses fictional data and **does not persist**; the full student/employer journeys are still planned. The verified main CI checks do not prove auth, persistence, security, or live search. Zod 3 remains under advisory: upgrade and revalidate contracts **before** parsing external API requests; do not claim the audit is clean.

**Ownership exception:** Steve unavailable 2026-11-14; Dallas patched MainNav, root-shell wiring, and steve-shell.spec.ts rebase. The AGENTS.md ownership table still stands for all future work.

**Integration status — 2026-11-14 (~1:50 Denver):** `main` at `d0391d8`. Merged since prior handoff: [#48](https://github.com/Kdixon04/CareerForge/pull/48) (RootShell student nav + deploy/docs) and [#50](https://github.com/Kdixon04/CareerForge/pull/50) (inert fail-closed résumé suggest/get/patch). Confirmed on main: `src/app/(student)/layout.tsx`, `src/app/api/resume/**`. Prep hub (#45/#47) and private import/read remain inert/fail-closed. **`src/lib/data/**` still not on main** — see exact adapter signatures in [keyan-adapter-impl-prompt.md](assignments/keyan-adapter-impl-prompt.md); honest demo claims in [judges-feature-list.md](assignments/judges-feature-list.md).

**PR [#49](https://github.com/Kdixon04/CareerForge/pull/49) (`feat/persist-pasted-jobs`) — NOT MERGE READY:** open, `mergeable=CONFLICTING` vs `main`, **no CI checks reported** (0 check runs on head). Diff is only `PasteJobForm.tsx` + new `POST /api/jobs` (direct Supabase insert); it does **not** add fail-closed-safe `src/lib/data/jobs` adapters and conflicts with main’s existing inert `POST /api/jobs/import`. Do **not** merge; do **not** flip persistence flags. Close or rewrite after Keyan ships adapters.

**Deployed smoke: NOT RUN** until a human completes [vercel-supabase-deploy-checklist.md](assignments/vercel-supabase-deploy-checklist.md) (no secrets in Git).

**Next 90 minutes (by owner):**

- **Dallas:** Keep import/resume routes fail-closed; do not merge #49; after Keyan lands `src/lib/data/jobs` (+ résumé if ready) with green CI, enable one-line adapter wiring only—no persistence flag flips until review; human deploy checklist + smoke; ping Will with URL + [WILL-VIDEO-SCRIPT.md](demo/WILL-VIDEO-SCRIPT.md).
- **Keyan:** Close/rewrite #49; implement `src/lib/data/jobs.ts` (+ résumé adapters) per [keyan-adapter-impl-prompt.md](assignments/keyan-adapter-impl-prompt.md) with user-scoped client/RLS; confirm migrations + seed ≥1 published employer job; Auth redirect URLs.
- **Steve (Dallas nav patch):** Shared student nav shipped via #48; further UI polish only if bandwidth.
- **Will:** Lock narration from demo table / [judges-feature-list.md](assignments/judges-feature-list.md); record after deploy smoke; fictional student only; label FIXTURE rows on screen.
- **Antigravity / Codex:** Enable import/GET/résumé only when Keyan adapters land; integrator merges only—no env invention.

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
