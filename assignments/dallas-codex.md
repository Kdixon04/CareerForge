# Dallas / Codex

> **Status: paused.** Codex credits are temporarily unavailable.
> Tasks listed here will resume in a future Codex session.
> Nothing here is assigned to Cursor or Antigravity.

Read [shared rules](../AGENTS.md), [team handoff](../teammates.md), [Dallas's assignment](dallas.md), and the [tool split](dallas-agent-coordination.md). This is a slice of Dallas's ownership only.

**Exclusive paths among Dallas tools:** `src/contracts/**`; `package.json` and `package-lock.json`; Dallas-owned framework/test/CI configuration; `src/app/layout.tsx` and `src/app/page.tsx`; `tests/e2e/dallas-*.spec.ts` and `tests/unit/dallas-*.test.ts`. Dallas uses Codex for shared coordination docs and integration changes after agreeing the exact edit. Cursor and Antigravity request contract/dependency changes instead of writing them.

**First small deliverable:** wire Steve's existing theme, styles and navigation into the real root layout; add one integrated phone/desktop Playwright check. Next, resolve the Zod advisory with a targeted compatible update and rerun contract tests **before** any external API request is parsed with Zod.

**Dependencies:** Steve's [component handoff](../src/components/ui/HANDOFF.md) and props; Keyan's confirmed schema/adapters; Cursor/Antigravity route contracts. Use verified role state for any employer navigation. Steve owns `src/app/globals.css`, components, theme and profile routes: request his exact CSS/profile change rather than editing those paths.

**Acceptance:** typecheck, contract/unit tests, production build, normal Chromium smoke, and focused 390×844/1280×800 navigation/theme/reload checks pass. Report fixture-only and skipped checks separately; do not claim profile persistence, auth or a live Claude call without testing them.

**Handoff to Dallas:** owner; changed paths; contract/dependency changes; exact commands and results or NOT RUN with reason; blocker; next owner/action. Ask Dallas to coordinate changes to Keyan's, Steve's, Will's or another Dallas tool's paths before touching them.
