# Steve Rogers — student profile, saved applications, and design

Read [AGENTS.md](../AGENTS.md) and the current [team handoff](../teammates.md) before editing. You own the student profile and saved-application experience through the UI and route layer. Keyan owns SQL and supplies user-scoped adapters; Dallas owns scaffold/shared schemas/auth shell and AI/job pages. Report exact cross-person contract or adapter needs to Dallas and the relevant owner in your handoff; do not change another owner's files.

Known skills: English, Spanish, Python, a little Java, Excel; limited database experience; strengths in aesthetics/navigation and team coordination. React/TypeScript experience and availability remain TBD. Pair briefly on your first route; use shared adapters rather than writing migrations.

## Paths and first slice

Owned: src/app/(student)/profile/**, src/app/(student)/saved/**, src/app/api/profile/**, src/app/api/applications/**, src/components/ui/**, src/components/nav/**, src/components/theme/**, src/styles/**, src/app/globals.css, public/brand/**, tests/e2e/steve-*.spec.ts, tests/unit/steve-*.test.ts.

Request changes outside those paths. Dallas wires your navigation/theme provider into root layout; coordinate small named props before integration. Don't edit package/config/lockfiles, contracts, SQL/adapters, employer pages or demo files.

First 60–90 minutes:
1. Inspect actual supplied logo/Stitch references (asset paths TBD). Report missing assets; use accessible Career Forge text as temporary wordmark. Never assume a particular prototype version or inspect claims as verified.
2. Create semantic tokens for both light and dark themes, plus one accessible Button/Input example. Measure text/control contrast.
3. Share component props and a screenshot at phone/desktop width with Dallas/Keyan. Don't wait for the whole design system before handing over usable components.
4. Build profile form against shared fictional fixtures; connect data when Keyan's first adapters land.

## Required deliverables

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

Landing palette milestone (merged PR #10): completed Dallas's requested globals.css bridge to shared semantic tokens, including card/CTA/focus styling. Phone/desktop light/dark, rendered contrast, keyboard action, system changes and no-JavaScript dark mode verified. Dallas has since integrated the global provider/startup script and Home navigation. See the component handoff for current evidence and limitations.

PR #17 on feature/steve-profile-theme removes the profile's redundant nested provider; retains its header/toggle/skip link because shared RootShell currently wraps only Home. Build/type validation, 16 unit tests and 32 normal browser checks pass; 6 callback project instances intentionally skip in normal smoke. The separate managed profile suite passes 7/7, including simulated success/error/conflict callbacks. Manual Home/Profile navigation, theme switching and reload verified; secret scan clean. The standards audit distinguishes fixture/component evidence from real persistence; the full Steve assignment is not finished.

New backend state: main ea26e26 includes Keyan's migration (1e8c016) and security handoff. Applied/RLS evidence is Keyan-reported, not independently rerun by Steve. Clients/adapters remain operations to implement; publish exact imports/signatures and agree the concurrency request before real save wiring. Shared contracts/config/dependencies and Keyan's SQL remain outside Steve's edits. Latest CI/CD evidence belongs to PR #17's final head; no deployment/security/persistence checks are implied by a green frontend CI job.

Theme reconciliation checkpoint: resumed in dedicated CareerForge-steve checkout, merged current main 8964410 safely, preserved full shared AGENTS.md unchanged. Local typecheck/build and 55 Vitest tests pass; Chromium 56 pass / 6 intentional callback-fixture skips. Home/Profile keyboard theme switching, navigation and reload pass at 390x844 and 1280x800 in both themes, manually and automatically. Only Steve-owned paths differ from main. See component handoff for exact current evidence, inherited dependency findings and adapter blockers. Real profile persistence remains unavailable here.
