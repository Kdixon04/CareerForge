# Career Forge team handoff

Read [AGENTS.md](AGENTS.md) and your own assignment: [Dallas](assignments/dallas.md), [Keyan](assignments/keyan.md), [Steve](assignments/steve-rogers.md), or [Will](assignments/will.md). AGENTS.md controls shared rules and path ownership; assignments control individual work. Dallas edits shared coordination decisions here. Other agents propose updates in their handoffs rather than editing this file concurrently.

## Verified state

At this handoff, CareerForge `main` is `f6702ca`: coordination PR [#3](https://github.com/Kdixon04/CareerForge/pull/3) and Steve's visual/profile work from PRs [#4](https://github.com/Kdixon04/CareerForge/pull/4) and [#9](https://github.com/Kdixon04/CareerForge/pull/9) are merged. The [main CI run](https://github.com/Kdixon04/CareerForge/actions/runs/43568833937) passed on that exact commit. Will's calendar PR [#7](https://github.com/Kdixon04/CareerForge/pull/7) was still open when checked on November 14, 2026; recheck current PR/main status before integrating. Pull current `main` before creating a feature branch.

Main has a Next.js landing page, provisional [contracts](src/contracts/), [fictional examples](src/data/examples.ts), and Steve's `/profile` editing preview. That profile uses fictional data and **does not persist**; the full student/employer journeys are still planned. The verified main CI checks do not prove auth, persistence, security, or live search. Zod 3 remains under advisory: upgrade and revalidate contracts **before** parsing external API requests; do not claim the audit is clean.

## Owners and next handoffs

- **Dallas:** foundation, shared contracts/config, jobs/résumé flow and integration. Give Cursor and Antigravity a stable contract and integrate tested slices. Dallas coordinates shared changes; Codex is his designated writer for contracts/config, and Dallas updates this handoff.
- **Keyan:** Supabase schema, RLS, adapters, security, and employer features. Confirm student/fact ID and storage shape (relational rows versus JSON), job verification/lifecycle, and résumé persistence/source-fact links. Send Dallas and Steve the exact confirmed fields, adapter names/signatures, migration state, and test results before they wire routes.
- **Steve:** profile/saved-application UI and routes, theme/navigation. His profile preview is fixture-backed; hand Dallas the component/provider props for the root shell and send Keyan exact adapter needs before real saving.
- **Will:** mobile-friendly in-app calendar for internship deadlines and personal reminders, upcoming in-app reminder states, Google Calendar event links/ICS exports, and (after Keyan's secure contact-data handoff) private professional contacts, meeting notes, and editable follow-up suggestions. Own demo/video and independent QA as well. Request saved-page/nav wiring from Steve and data adapters from Keyan; give owners reproducible findings and mark each demo claim built, fallback, planned, or cut.

Immediate MVP target: profile facts → paste a job → generate evidence-linked résumé suggestions → review/edit → save the next step. That journey is **planned**, not working yet. Live job search follows only after the pasted-job journey works. The calendar deadline/reminder view and external exports can proceed independently; persistent contact follow-ups depend on a private contacts schema and adapter. Background delivery and two-way calendar sync remain later work. Do not change another owner's files; request exact cross-owner changes in a handoff. No credentials or real student data in handoffs.

Handoff format: **owner; changed paths; contract changes requested or made; checks actually run and results (or NOT RUN with reason); blocker; next owner/action.**
