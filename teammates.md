# Career Forge team handoff

Read [AGENTS.md](AGENTS.md) and your own assignment: [Dallas](assignments/dallas.md), [Keyan](assignments/keyan.md), [Steve](assignments/steve-rogers.md), or [Will](assignments/will.md). AGENTS.md controls shared rules and path ownership; assignments control individual work. Dallas edits shared coordination decisions here. Other agents propose updates in their handoffs rather than editing this file concurrently.

## Verified state

PR [#2](https://github.com/Kdixon04/CareerForge/pull/2) is merged into CareerForge `main` at `e29015d`. This coordination update is on `dallas/agent-coordination`; it is not yet merged. Pull the updated `main` before creating a feature branch. The merged foundation has a Next.js landing page, provisional [contracts](src/contracts/), and [fictional examples](src/data/examples.ts). It does not yet implement the student or employer journeys.

On the merged foundation, `npm test` passed 7/7, `npm run build` passed, and `npm run smoke` passed 2/2 Chromium desktop/mobile checks locally; the `main` CI job also succeeded. These are foundation checks, not feature, persistence, security, or live-search proof. The production audit still reports a high Zod 3 advisory. Upgrade and revalidate the contracts **before** Zod parses external API requests; do not claim the audit is clean.

## Owners and next handoffs

- **Dallas:** foundation, shared contracts/config, jobs/résumé flow and integration. Give Cursor and Antigravity a stable contract and integrate tested slices. Dallas coordinates shared changes; Codex is his designated writer for contracts/config, and Dallas updates this handoff.
- **Keyan:** Supabase schema, RLS, adapters, security, and employer features. Confirm student/fact ID and storage shape (relational rows versus JSON), job verification/lifecycle, and résumé persistence/source-fact links. Send Dallas and Steve the exact confirmed fields, adapter names/signatures, migration state, and test results before they wire routes.
- **Steve:** profile/saved-application UI and routes, theme/navigation. Hand Dallas the component/provider props for the root shell; send Keyan exact adapter needs. Use fixtures until adapters are ready.
- **Will:** fictional demo materials and manual QA. Give owners reproducible findings and mark each demo claim built, fallback, planned, or cut.

Immediate MVP target: profile facts → paste a job → generate evidence-linked résumé suggestions → review/edit → save the next step. That journey is **planned**, not working yet. Live job search follows only after the pasted-job journey works. Do not change another owner's files; request exact cross-owner changes in a handoff. No credentials or real student data in handoffs.

Handoff format: **owner; changed paths; contract changes requested or made; checks actually run and results (or NOT RUN with reason); blocker; next owner/action.**
