# Career Forge handoff

All four teammates and their agents: read [AGENTS.md](AGENTS.md) and your own file in [assignments/](assignments/) before editing. After this PR merges, pull the updated CareerForge `main` before creating a feature branch.

Use [src/contracts/](src/contracts/) and [src/data/examples.ts](src/data/examples.ts) as the initial shared interface. Dallas owns foundation, contracts, jobs, and résumé flow; Keyan owns Supabase, security, and employer work; Steve owns profile, saved applications, and theme; Will owns demo and manual QA. Respect the file ownership table in AGENTS.md. Request exact shared contract/config changes from Dallas before editing those files.

Keyan still needs to confirm student and fact IDs/storage shape, relational facts versus JSON, job verification/lifecycle, and résumé persistence/source-fact links. Do not treat the fictional examples as real student data or a confirmed database schema.

The immediate MVP journey is profile facts → paste a job → generate evidence-linked résumé suggestions → review/edit → save the next step. Live job search follows if the pasted-job journey works.

Report commands and actual outcomes. The foundation previously passed 6/6 contract tests and a production build; desktop/mobile Playwright passed on the CI branch after Chromium installation. Re-run checks for your own changes and mark unrun checks as unrun.
