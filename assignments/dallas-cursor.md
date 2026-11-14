# Dallas / Cursor

Read [shared rules](../AGENTS.md), [team handoff](../teammates.md), [Dallas's assignment](dallas.md), and the [tool split](dallas-agent-coordination.md). This is a slice of Dallas's ownership only.

**Exclusive paths among Dallas tools:** `src/app/(student)/jobs/**` and `src/app/(student)/match/**`, including focused tests colocated there. Do not edit Steve's profile/saved pages or shared UI/theme components.

**First small deliverable:** build a usable pasted-job form, job detail view, and résumé suggestion review/edit screen using [fictional examples](../src/data/examples.ts) and [shared contracts](../src/contracts/). Label examples and unverified jobs clearly; show source URLs and evidence fact links. Connect server routes only after Antigravity supplies working endpoints.

**Dependencies:** Codex's stable contracts/root shell, Antigravity's import/read/suggest/edit routes, Keyan's authorized adapters, and Steve's shared visual components. Live job discovery is optional after the pasted-job journey works.

**Acceptance:** write focused UI tests before behavior; verify labels, errors, loading/empty states, review/edit controls and safe rendering of job text. Once runnable, check phone/desktop and both themes in Playwright. Reload/persistence claims require real routes and adapters, not fixtures.

**Handoff to Dallas:** owner; changed paths; exact contract/route requests; commands and results or NOT RUN with reason; blocker; next owner/action. Request changes to `src/contracts/**`, dependencies/config, root layout, API routes, or another person's files from Dallas instead of making them directly.
