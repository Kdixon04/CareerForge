# Steve — saved-application fixture UI handoff

Current integration note (November 14, 2026): main has sign-in, a connected `/profile` save path and published-job browsing. This `/saved` route is still fictional and memory-only: no account reads or writes, no application persistence, and reload resets edits. Its browser checks use explicit fixture settings and do not establish database or account isolation. The branch and test checkpoints below are historical; review the current PR head and CI for current results.

Branch: `feature/steve-saved-preview`, PR #29, synced with main `a64f637`. The intervening main changes after the locally tested `8964410` base are documentation only. Theme PR #17 is separate: code checkpoint `38336c7` passed CI run 43589998919; its later documentation-only main sync is `c9ac840` (see current PR checks). Only Steve-owned source, tests and handoffs change. Full shared AGENTS.md, contracts, packages, auth clients, adapters and SQL are unchanged.

## What works locally

`/saved` is explicitly a fictional, in-memory design preview. It shows three fictional examples: available summary, paused/inactive summary and unavailable placeholder. Status, personal reminder and notes can be checked/updated within the page; removal reaches an empty state and resetting restores the examples. Reload intentionally discards edits. No API request, sign-in, application submission, account data or persistence is involved. No private data is stored in localStorage; only the shared theme preference is allowed.

Uses existing MainNav, ThemeToggle, Button, Input and Textarea plus new consumed Card/Badge primitives. Controls are labelled, keyboard reachable and announced; removal moves focus to Reset. Source links use semantic brand colors with visible focus. Both light/dark and 390x844 / 1280x800 are covered. Personal reminders remain separate from listing deadlines; unknown deadlines say Deadline not provided and sample listing dates are unverified. Hidden/draft fixture summaries are suppressed for display, which is **not** an authorization mechanism.

Files: this folder's page.tsx, SavedApplicationsPreview.tsx, preview-model.ts, preview-model.test.ts, fixtures.ts, saved.css, this handoff; src/components/ui/Card.tsx and Badge.tsx; tests/e2e/steve-saved-preview.spec.ts; Steve's component handoff and assignment.

## Evidence

- Four focused model tests first failed on explicit unimplemented behavior, then passed. Cover valid/empty/wrong input, calendar dates, all allowed statuses, 4,000-character note bound, unknown ownership fields, immutable edits, missing IDs, repeated remove and display placeholders. These are fixture/UI tests, not security/isolation tests.
- Typecheck PASS. Vitest 59/59 PASS (55 inherited + 4 new).
- Production build PASS, including actual /saved route.
- Focused Chromium 8/8 PASS: phone/desktop, light/dark under both configured Chromium projects. Verifies labels, keyboard/skip link, tracking changes, unknown/unverified deadline distinction, safe plain text, body overflow, rendered badge/control/source-link text contrast >=4.5:1, repeated checks, empty/remove/reset, theme navigation and explicit reset-on-reload. Captures API requests (none) and localStorage (theme only).
- Full Chromium smoke: 56 PASS / 6 existing callback-fixture cases intentionally skipped by the normal config. No tests were weakened or deleted; existing main job/match/profile tests remain included.
- Manual browser: entered status/notes, selected reminder with native picker, checked changes, reloaded and observed original values; removed all examples to empty, reset, switched theme and inspected desktop dark layout. Final keyboard-focus follow-up verified after the adjustment.
- Secretlint recommended preset: new source/tests and built browser JS, no findings. Whitespace/diff scope checked before commit. No standalone lint/deployment result claimed.

## Backend blocker and exact requested boundary

Keyan/Dallas request: https://github.com/Kdixon04/CareerForge/pull/17#issuecomment-6876595298 . Main at this checkpoint has database migrations/security notes but no src/lib/supabase or src/lib/data implementations. During implementation Keyan opened PR #28 at 1693c90, foundation only: `createSupabaseBrowserClient()` in src/lib/supabase/client.ts and async `createSupabaseServerClient()` in src/lib/supabase/server.ts. Its foundation CI subsequently passed (run 43590835555); this is build/test evidence, not hosted session or database verification. It adds no authentication UI or src/lib/data atomic profile/application adapter, so it is not yet the authorized persistence boundary required for wiring. Keyan's applied-schema checks are owner-reported; Steve did not rerun hosted security tests.

Needed exports/import paths and verified branch/commit: browser/server Supabase clients, caller verification/session context, getOwnProfile, atomic saveOwnProfile with expected version/returned updatedAt and conflict/foreign-fact error mapping; listOwnApplications, saveApplication(jobId), updateApplication(id,{status?,deadline?,notes?}), removeApplication(id), plus authorized job summaries for paused and hidden content. Existing profile UI callback: onSave(draft: ProfileDraft, expectedUpdatedAt: string): Promise<StudentProfile>; this is a UI boundary, not a new shared contract. Ask Dallas to approve the adapter/API mapping and dependency/auth-shell readiness. Credentials stay out of Git/chat.

Next slice: once authorized adapters and fictional A/B sessions exist, wire Steve's own profile GET/PUT/UI in a small PR and verify save/reload plus second-user denial against the actual database. Then replace saved fixtures with authorized application data and add API errors/loading/auth-required handling. Do not silently use fixtures as a fallback for failed account reads, treat this preview as persisted, or create competing SQL/contracts/adapters.

Current main CI 8964410 is green; no main functional failure was reproduced. Inherited npm audit findings (7 total: 3 moderate, 2 high, 2 critical) remain Dallas-owned; PR #23 addresses Zod. CI does not run audit. Existing main and this preview are not claimed security-clean or deployed.

Current PR checks: https://github.com/Kdixon04/CareerForge/pull/29/checks . Documentation-only follow-ups do not alter the tested UI code. Exact final heads/results are reported in GitHub rather than implying an earlier checkpoint is the current head.
