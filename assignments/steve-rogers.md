# Steve Rogers — student profile, saved applications, and design

Current integration note (November 14, 2026): main has sign-in and a connected profile loader/save route. Profile fixture mode remains explicitly unsaved; the normal signed-in path needs database and account-isolation verification. PR #17's theme cleanup must preserve the connected save path. Older milestone notes below are historical and do not override current code or the [team handoff](../teammates.md).

Read [AGENTS.md](../AGENTS.md) and the current [team handoff](../teammates.md) before editing. You own the student profile and saved-application experience through the UI and route layer. Keyan owns SQL and supplies user-scoped adapters; Dallas owns scaffold/shared schemas/auth shell and AI/job pages. Report exact cross-person contract or adapter needs to Dallas and the relevant owner in your handoff; do not change another owner's files.

Known skills: English, Spanish, Python, a little Java, Excel; limited database experience; strengths in aesthetics/navigation and team coordination. React/TypeScript experience and availability remain TBD. Pair briefly on your first route; use shared adapters rather than writing migrations.

## Current production-guard preparation follow-up

PR #35 remains DRAFT. Main through afcb1c6 was safely merged. Steve did not modify/merge #17 or #29; teammate walker2023-glitch independently integrated both while this work was in progress. Prepared (not active) verified resolver now accepts owner-supplied supported Auth/trusted role verification and ordinary user-scoped adapter connection, rejects unsafe config/test modes/fictional aliases/mismatched subjects, and keeps fixed public errors/no-store behavior. Corrupted profile reads and simultaneous application updates have extra tests. Local checks: 124 unit/integration, 37 explicit mocked contract/guard, 64 Chromium + 6 existing skips, 9 memory lab, 7 profile harness; typecheck/build/Secretlint/production audit/workflow validation pass. Full audit still fails on six inherited dev packages; no dependency changes. Hosted CI at old 9e2fe3b passed; new head must pass independently. [Live checklist](../src/components/ui/student-data/LIVE-VERIFICATION.md) is NOT RUN; [handoff](../src/components/ui/student-data/HANDOFF.md) records commands, exact files and evidence limits. Keyan's atomic driver/Auth/RLS proof and Dallas's approvals/isolated environment/active security CI/dependency remediation/hosting remain required. Full assignment and production saving/isolation/A-B/deployment are not complete.
## Adapter preparation checkpoint — November 14, 2026

See [adapter preparation/evidence handoff](../src/components/ui/student-data/HANDOFF.md). New branch feature/steve-adapter-preparation preserves #17/#29 unchanged. Complete local consumer code: typed interfaces/strict DTOs, prepared fail-closed handler factories, loading/save/retry/reset/error/dirty UI and accessible focus. Prepared only: real adapter mapping, GET/PUT/application endpoint adoption and a Dallas-review CI workflow. Mocked only: memory storage, fictional session/role aliases, two-user HTTP and reload tests. Not verified: real saving, production isolation/RLS, live security, hosted A/B or deployment. Keyan still owns atomic/versioned data operations; Dallas owns isolated A/B credentials/environment, shared-contract/CI approval and dev dependency remediation. Main's newly added sequential PATCH is not atomic and has been reported, not certified. Public saved examples remain stateless; the separate lab only retains data for its process lifetime. Full details, commands, blockers and file inventory are in the handoff.
Follow-up: boundary review adds checkedAdapter input/identity/response binding, complete no-store error tests, safer readiness and application error focus. Latest local suite: 89 unit/integration, 24 explicit contract, 56 normal Chromium (6 existing skips), 9 memory lab, 7 profile harness checks pass. [Connection mapping](../src/components/ui/student-data/INTEGRATION.md) and [dependency owner actions](../src/components/ui/student-data/DEPENDENCY-AUDIT.md) record the remaining decisions. All live saving/security/A-B/deployment limits above still apply; no full assignment completion.

## Paths and first slice

Owned: src/app/(student)/profile/**, src/app/(student)/saved/**, src/app/api/profile/**, src/app/api/applications/**, src/components/ui/**, src/components/nav/**, src/components/theme/**, src/styles/**, src/app/globals.css, public/brand/**, tests/e2e/steve-*.spec.ts, tests/unit/steve-*.test.ts.

Request changes outside those paths. Dallas wires your navigation/theme provider into root layout; coordinate small named props before integration. Don't edit package/config/lockfiles, contracts, SQL/adapters, employer pages or demo files.

First 60–90 minutes:
1. Inspect actual supplied logo/Stitch references (asset paths TBD). Report missing assets; use accessible Career Forge text as temporary wordmark. Never assume a particular prototype version or inspect claims as verified.
2. Create semantic tokens for both light and dark themes, plus one accessible Button/Input example. Measure text/control contrast.
3. Share component props and a screenshot at phone/desktop width with Dallas/Keyan. Don't wait for the whole design system before handing over usable components.
4. Build profile form against shared fictional fixtures; connect data when Keyan's first adapters land.

## Required deliverables

Current separate fixture slice: `/saved` is an explicitly fictional in-memory tracking preview; see [saved UI handoff](../src/app/(student)/saved/HANDOFF.md). It resets on reload and makes no account/API writes. Current main has a connected profile save path; saved-application persistence still needs an authorized adapter and route.

- Both themes, not a stretch: visible accessible toggle, first-visit system preference, remembered theme preference across navigation/reload, readable forms/focus/errors/cards on all feature pages. Local storage may hold theme preference, not personal profile/resume content.
- Preserve logo artwork/proportions. Use actual prototype for final colors/fonts; provisional warm leather/orange/gold/cream/charcoal is acceptable until it arrives. Keep controls consistent and professional.
- Reusable Button/Input/Textarea/Card/Badge and navigation; avoid decorative complexity. Enabled buttons keyboard reachable, disabled native buttons non-activatable. Do not require disabled native controls to be focusable.
- Profile: display name, career field and add/edit/remove typed skills/interests/education/projects/experience. Shared StudentFact ids support evidence. Clear save/error/loading/empty states.
- GET/PUT /api/profile use verified caller and Keyan's adapter; reject foreign ids and accept only editable fields. Persist atomic save and show conflict feedback rather than silently overwriting a newer profile.
- Saved list: job summary/source, status, personal deadline and notes. GET/POST/PATCH/DELETE application routes use Keyan's authorized adapters; don't duplicate job SQL or an analytics save counter. Saving is unique per caller/job.
- Display paused listings as inactive and hidden listings as unavailable placeholders; retain tracking state. Unknown deadlines read "Deadline not provided"; personal reminder dates don't verify posting deadlines.
- Main nav supports Profile, Find Jobs, Saved and the correct employer link when permitted. Role-based navigation is convenience, not authorization.

## Tests before feature code

Write tests for validation, fact add/remove, denied foreign id, owned-record route calls, status/deadline updates and save/unsave idempotence. Use fixtures/mocks until adapters exist and label those checks as UI-only; final persistence checks require real test database.

Playwright tests/e2e/steve-profile.spec.ts: sign in -> add skill/project -> save -> reload -> exact values remain -> edit/remove -> reload -> expected data. Saved-app check: save from a job -> change status/notes/reminder -> reload -> values retained -> unsave -> absent. Two-account isolation is shared with Keyan, using ordinary users.

At 390x844 and 1280x800, light and dark: no horizontal overflow; labels/readability/focus/touch targets usable; menu/toggle work by keyboard; theme persists through navigation and reload; loading/empty/error states are readable. Inspect auth/employer pages with their owners for shared theme issues. Use 4.5:1 body-text and 3:1 meaningful non-text/large-text contrast targets; don't claim a ratio without measurement. Send screenshots without real personal data.

Run focused tests, available typecheck/lint/build and integrated Playwright. Report NOT RUN with a reason when tools/credentials are absent; don't call a fixture reload proof of database persistence.

## Security, coordination, and finish

Render user and AI strings as text, not HTML. No keys/logged profiles, client role assignment or cross-user cache. Show plain-English disclosure before relevant content goes to Claude; coordinate final notice with Dallas/Will. Do not persist personal profile data in browser localStorage; use supported Supabase sessions for auth.

Share a working styled component/profile slice early. Each route derives user identity from verified session and uses user-scoped RLS adapter; don't trust request userId. Give Keyan exact missing adapter signatures and Dallas exact shared-schema requests.

Report task/files/checks/browser themes+widths/security findings/blockers/next. If helping track team checkpoints, use a short status note and nudge; don't edit shared ownership without coordination. Final 20–25% is polish/verification/video support, not a new component rewrite.

Stretch after both themes/core persistence: Spanish strings if team wants them, small skeleton polish, calendar export UI with explicitly agreed date behavior.


Confirmed with Steve: explain as we go; use CareerForge.webp colors. Submission: November 14, 2026, 4 p.m. America/Denver; ready by 3:30 p.m. Profile → job → résumé edits → saved application is the confirmed demo. Broader scope does not authorize extra features. No prototype available. Steve approved the first build plan.

First visual slice on feature/steve: semantic light/dark tokens, accessible Button/Input, ThemeProvider/ThemeToggle, MainNav and an isolated React SSR/hydration preview. See [component handoff](../src/components/ui/HANDOFF.md) for exact props, commands and Dallas's root-shell integration request. The shared Next.js/React 18 scaffold and provisional contracts are now on main.

Profile milestone: merged main at 0ac89a1 and now use its React 18 scaffold, shared StudentProfile/StudentFact schemas and exampleStudent. Actual `/profile` route supports display name/career field and add/edit/remove typed experience with stable fact ids, labels/errors, focus handling and both themes. It is explicitly fictional: Save profile stays disabled until Keyan's verified own-profile adapter is connected; Check profile validates only, and reload resets edits. The local callback boundary has simulated pending/success/error/conflict tests; no real persistence claim.

Next handoff: exact adapter/auth signatures and an agreed concurrency request field, followed by real save/reload and two-user isolation checks. Saved applications remain unbuilt. The inherited dependency audit is not clean; Dallas owns updates. The isolated preview and simulated callbacks do not prove persistence.

Landing palette milestone on feature/steve-shell-colors: completed Dallas's requested globals.css bridge to shared semantic tokens, including card/CTA/focus styling. No layout/page/config/contract changes. Production build/type validation and 18 existing unit/contract checks pass; focused landing browser tests 5/5, full smoke 20 pass / 6 fixture callbacks intentionally skip, and secret scan clean. Phone/desktop light/dark, rendered contrast, keyboard action, system changes and no-JavaScript dark mode verified. Root toggle/navigation/startup script remain Dallas's integration task; profile adapters remain Keyan's blocker. See the component handoff for exact paths, commands and evidence limits.
