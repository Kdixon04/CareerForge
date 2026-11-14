# Dallas / Antigravity

Read [shared rules](../AGENTS.md), [team handoff](../teammates.md), [Dallas's assignment](dallas.md), and the [tool split](dallas-agent-coordination.md). This is a slice of Dallas's ownership only.

**Exclusive paths among Dallas tools:** `src/lib/jobs/**`, `src/lib/claude/**`, `src/app/api/jobs/**`, and `src/app/api/resume/**`, with focused tests colocated there. These are server paths; keep Claude and privileged keys out of browser code.

**First small deliverable:** validate a pasted job and implement authorized import/read behavior through Keyan's user-scoped adapters. If the adapter is unavailable, build and test the boundary while reporting the route blocked; do not present in-memory fixtures as saved jobs. Then add bounded, evidence-linked résumé suggest/read/edit routes with mocked Claude responses in routine tests.

**Dependencies:** Codex's shared contracts and Zod security update before parsing external API requests; Keyan's verified auth, job/profile/résumé adapters and ownership rules; Cursor's UI request/response needs. Obtain student consent before sending relevant facts to Claude. Do not claim live search or persistence from mocks.

**Acceptance:** focused tests first for invalid/oversized input, unauthenticated and foreign IDs, trusted source/verification fields, model errors, foreign evidence IDs, and edited-bullet handling. Run typecheck/build and route tests; run Playwright once a route is connected to the real app. Mark live Claude and database checks NOT RUN until actually exercised.

**Handoff to Dallas:** owner; changed paths; exact contract/adapter requests; commands and results or NOT RUN with reason; blocker; next owner/action. Request `src/contracts/**`, package/lockfile, root UI, Keyan's data/security paths, or Steve's files from Dallas instead of editing them.
