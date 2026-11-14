# Dallas's coding-agent split

This divides only [Dallas's assignment](dallas.md). Read [AGENTS.md](../AGENTS.md) and [teammates.md](../teammates.md) first. Keyan, Steve, and Will retain their own files and decisions. Dallas integrates their handoffs; no AI tool edits the shared status file independently.

Start with the short task brief for your tool: [Codex](dallas-codex.md), [Cursor](dallas-cursor.md), or [Antigravity](dallas-antigravity.md).

| Tool | Dallas-owned work and exclusive paths |
|---|---|
| Codex | Shared `src/contracts/**`, dependencies/configuration (`package.json`, lockfile, framework/CI), Zod security update, integration, and Dallas end-to-end tests. |
| Cursor | Student jobs and résumé review UI at `src/app/(student)/jobs/**` and `src/app/(student)/match/**`. Start against fictional `src/data/examples.ts` until server routes work. |
| Antigravity | Server-side pasted-job flow, discovery adapters, Claude integration, and résumé routes at `src/lib/jobs/**`, `src/lib/claude/**`, `src/app/api/jobs/**`, and `src/app/api/resume/**`. |

Codex alone changes `src/contracts/**`, `package.json`, and the lockfile among these three tools. Cursor and Antigravity request an exact schema/dependency change from Dallas; they do not edit those files. Each tool uses its own branch and worktree from current CareerForge `main`. One writer per file at a time; announce a precise handoff before changing writers. Ask Keyan for adapter signatures and Steve for shared UI/theme props rather than editing their paths.

## First slices and integration

1. **Codex:** integrate Steve's existing theme/navigation in the root shell and test it in the actual app; resolve the Zod advisory and revalidate contracts before external request parsing.
2. **Antigravity:** test and implement validated pasted-job import/read, then evidence-linked résumé suggest/read/edit routes using Keyan's user-scoped adapters. Mock Claude in routine tests.
3. **Cursor:** build paste/job detail and résumé review/edit UI against fictional examples, then connect the working routes. Keep search clearly optional.
4. **Codex:** integrate small route and UI slices in that order, add Dallas's end-to-end test for paste → suggestions → edit/save → reload, and run it at phone and desktop widths. Add live discovery only after that journey works; then test it separately.

A slice is ready to hand off when its owner names changed paths, contract changes or requests, exact commands/results, blocked or skipped checks, and the next owner/action. Write focused tests before feature behavior; run Playwright after a runnable feature. Never call a fixture test proof of database persistence or an unrun check passing. Dallas reviews and updates shared coordination decisions in `teammates.md`.
