# Steve — adapter preparation and evidence limits

Branch: `feature/steve-adapter-preparation`, based on Steve's preserved PR #29 checkpoint `317f6dd` plus main `1ab45e6`. PR #17 (`c9ac840`) and PR #29 (`317f6dd`) are protected: no commits, metadata updates, merges, resets or force pushes were made to them during this task. Main changes were merged only into the new preparation branch. Shared AGENTS.md, shared schemas, SQL, package/lockfile and active workflow configuration have no independent Steve edits.

## Status: complete / prepared / mocked / blocked

- **Complete local code:** typed consumer interfaces, strict request/response validation, bounded JSON/enveloped error handling, subject checks, injectable profile/application editors, unsaved-change protection, retry/reset/focus behavior, explicit test-double labels and stronger public saved-preview wording.
- **Prepared, not a deployed API:** GET/PUT profile and GET/POST/PATCH/DELETE application handler factories in Steve's API directories. They are ordinary modules, not Next route exports. Default adapter resolution returns 503; it never substitutes sample data. Public /profile and /saved are not switched to the memory adapter.
- **Mocked evidence:** memory store, fictional session aliases, loopback HTTP service and browser lab. Reload/reconnect reaches the same server memory; a new store/server loses edits. These tests do not verify Supabase Auth/JWT/cookies, RLS, PostgreSQL transactions, production durability, production two-user isolation or a live A/B environment/experiment.
- **Keyan dependency:** approved user-scoped adapter/bridge, atomic profile+facts transaction with full-precision version compare-and-swap, foreign-fact checks, own applications/authorized summaries, grants/RLS verification, ordinary fictional A/B sessions and recovery evidence. Do not implement a second schema or use a service-role client for assertions.
- **Dallas dependency:** approve/promote the consumer contract into shared schemas if desired; approve the API method/error/concurrency mapping; provide isolated test project/accounts and build/runtime auth configuration; approve active CI configuration and remediate inherited development dependencies.
- **Cannot verify here:** live saving/security/A-B isolation, deployed behavior/CD, full student/employer demo, real driver conformance and database crash/rollback behavior. No live environment or driver is configured. Complete environment values alone still cannot enable a real driver.

## Main inspection finding (not fixed or disguised as atomic persistence)

PR #28 is merged and supplies createSupabaseBrowserClient() and async createSupabaseServerClient(). Main also now has a profile page and PATCH route from Keyan's profile slice. That route reads/checks updated_at using JavaScript millisecond timestamps, then separately updates profiles, deletes student_facts and inserts replacements. The version is not part of the UPDATE condition and the writes are not one transaction. A concurrent save or later failure can overwrite/partially replace data. It also lacks the proposed GET/PUT and common error envelope. The current live route is preserved, not certified by these tests; replace/review it before approving real writes through the prepared interface. This finding and the requested owner boundaries were sent to Keyan/Dallas: https://github.com/Kdixon04/CareerForge/pull/28#issuecomment-6878915795 .

## Proposed consumer contract (requires Keyan/Dallas approval)

Definitions: src/components/ui/student-data/adapter-contract.ts. These types deliberately remain in Steve-owned consumer code; they are not a competing database/schema or a claim of owner approval.

| Method | Input | Output / rules |
|---|---|---|
| getProfile / expected GET /api/profile | No profile/user query ID | Own Profile; empty initial name/facts allowed on read; userId equals verified Auth subject |
| putProfile / expected PUT /api/profile | displayName, field, facts, expectedUpdatedAt | Atomic full replacement of own editable profile/facts; returns new Profile/version |
| listApplications / GET /api/applications | No client ownership fields | Own Application[] plus authorized job summary or null |
| saveApplication / POST /api/applications | jobId only | Check job access; unique (caller,job); retry returns same application |
| patchApplication / PATCH /api/applications/[id] | status?, personal deadline?, notes?, expectedUpdatedAt | Own row; validate patch; compare version; expectedUpdatedAt is an explicit proposal requiring approval |
| removeApplication / DELETE /api/applications/[id] | UUID path ID | Own unsave; same {id} acknowledgement for absent/foreign IDs; retry is harmless |

The production resolver must verify each session with supported Auth verification and enforce student role **before parsing/using a mutation**, derive identity on the server, then return a user-scoped client/adapter. subjectId is response/cache-check metadata, not browser authority. kind=real is a driver label, not a security attestation. Test aliases x-lab-user are accepted only by the separate test server and must never be copied into production authentication.

All profile/application/fact/job identifiers are UUIDs. Profile.userId and Application.userId equal the verified caller; a fact cannot move users; jobId refers to an authorized persisted job, not an unsaved preview ID. Applications remain user-owned when a listing becomes unavailable. Paused saved listings remain inactive summaries; hidden content is null while tracking remains. Profile edits/deletions must not mutate historical resume evidence snapshots (Keyan's backend responsibility; this mock does not model resumes).

Validation: strict keys; display name 1–120 trimmed on write, field <=160/null; <=100 facts, unique IDs, each fact text 1–2,000, org <=200, free-text dates <=100, <=30,000 combined fact/org/date characters. Empty fact arrays and empty notes are valid. Notes <=4,000. Personal/listing calendar dates use valid YYYY-MM-DD (year 0000 rejected), not fabricated instants; reminders do not verify listing deadlines. Statuses: saved/applied/interviewing/offer/rejected. Ownership, roles, provenance, job verification and server timestamps cannot be edited in the body. HTTPS source URLs with embedded credentials are rejected. JSON media type must be exact; request body streamed/bounded to 196,608 bytes.

Success envelope: {data:T}. Failure envelope: {error:{code,message}}. INVALID_INPUT=400, UNAUTHENTICATED=401, FORBIDDEN=403, NOT_FOUND=404 (missing or inaccessible), CONFLICT=409, NETWORK_ERROR/INVALID_DATA/UNAVAILABLE=503. Known public messages only; no SQL/stack/profile/token echoes. Responses use private no-store, Vary Cookie/Authorization, nosniff and request ID. Mutations require matching Origin. A real Next/Vercel bridge must use its approved canonical destination/origin handling and verified caller; do not trust forwarded headers or body ownership fields.

Treat updatedAt as an opaque full-precision server version. Do not round it through JavaScript Date before database comparison. Profile/facts validation and writes must commit together or leave all old data untouched. Exactly one concurrent save using an old version may succeed; other saves receive 409. A retry after an ambiguous network failure can conflict: preserve draft, fetch latest explicitly and let the user resolve it. No silent overwrite. Application updates use the same proposed version behavior. POST uniqueness and DELETE idempotence are separate from versioned PUT/PATCH semantics.

## Injection and conformance points

StudentDataAdapter defines getProfile, putProfile, listApplications, saveApplication, patchApplication, removeApplication. Adapt Keyan's eventual getOwnProfile/saveOwnProfile/application operations into this shape; implement the mapping once. Reuse ProfileAdapterEditor and ApplicationsAdapterEditor with an injected adapter. Without one, they render unavailable rather than fixtures. Returned DTOs are schema/subject-checked before rendering. Save failures preserve drafts; stale data is not automatically reloaded over edits. User switching and application reload are blocked while dirty; explicit reset/discard is available. Native beforeunload warns about unsaved edits. Loading/error/empty/success are announced and mutation errors get keyboard focus.

Reusable conformance entry: testing/contract-suite.ts -> studentAdapterContract(name, createHarness, ids). A real harness must provision only fictional data through trusted setup, then return ordinary A/B/anonymous/employer clients with confirmed subject IDs. Supply seeded private/public jobs and A's fact as documented by ContractHarness. Reconnect must open a fresh ordinary client/session. setJobStatus is fixture setup only, not an assertion run as admin. All assertions use ordinary clients and check returned AND unchanged stored state after denial. Tests include both directions of facts/applications isolation, strict shapes, bounded input, stale/concurrent updates, no partial changes, hidden/paused behavior and repeat operations. The tests can reject an inadequate real bridge; they cannot verify one that has not been supplied/run.

## Safe local commands

```powershell
npm ci
npm run typecheck
npm test
node src/components/ui/student-data/testing/verify-contracts.mjs
npm run build
# Only for normal smoke, matching main's explicit fictional fixture configuration:
$env:CAREERFORGE_E2E_PROFILE_FIXTURE='1'
$env:CAREERFORGE_E2E_JOBS_FIXTURE='1'
npm run smoke
node node_modules/@playwright/test/cli.js test --config src/components/ui/student-data/testing/playwright.config.ts
```

The lab config explicitly opts in to STEVE_ADAPTER_LAB=test-double and development mode, binds only 127.0.0.1:4318, refuses reuse of another server, and keeps browser output separate from generated assets. No Supabase credentials, production data or real external service is needed. For manual local use set STEVE_ADAPTER_LAB=test-double, NODE_ENV=development and run testing/serve-lab.mjs. Stop it to erase the memory store. Do not deploy the server or set the inherited E2E fixture switches in a hosted production environment. The new lab itself refuses production startup even if its flag is set.

Live preparation: STEVE_LIVE_CONTRACTS defaults off. Enabling it requires STEVE_ISOLATED_PROJECT=yes, HTTPS NEXT_PUBLIC_SUPABASE_URL, a publishable key (never secret/service-role), distinct fictional E2E_STUDENT_A/B_EMAIL and E2E_STUDENT_A/B_PASSWORD in a protected environment, plus the approved real harness. No values are committed. verify-contracts.mjs intentionally exits 1 with REAL_ADAPTER_NOT_CONNECTED if a live run is requested now; it never reports mocked results as live. Configuration readiness returns missing variable names, not values. Live contracts and A/B testing remain NOT RUN.

## Checks and CI

Current local results are recorded in the final verification note below. Existing npm test discovery includes all new .test.ts files, so ordinary project CI automatically receives contract, HTTP and readiness assertions. The browser lab is a separate explicit command, not skipped cases disguised as successful production checks. Existing tests remain intact.

Security scanner:

```powershell
npm install --prefix node_modules/.cache/steve-security-tools --no-save --no-package-lock secretlint@13.1.0 @secretlint/secretlint-rule-preset-recommend@13.1.0
node src/components/ui/student-data/testing/scan-secrets.mjs
npm audit --omit=dev --audit-level=moderate
npm audit --audit-level=moderate
```

The scanner requires Node >=22 and scans source/tests/workflows/env example plus normal browser and lab browser bundles when present. Tool dependencies/config/output remain ignored and separate from runtime dependencies. Secretlint is a real scanner, not a string search presented as a secret audit.

Active .github/workflows and package fixes belong to Dallas. testing/steve-adapter-contracts.workflow.yml is a runnable proposal, deliberately **not active CI** until approved/copied by Dallas. It has read-only permissions, no live secrets, explicit mocked browser checks, production AND full dependency gates, and pinned scanner installation even if audit fails. Owner approval was requested; none received at this checkpoint. Full audit currently fails with 6 inherited dev findings (3 moderate, 1 high, 2 critical: Vitest/mocker, Vite/vite-node, esbuild, tinypool). Production audit passes with zero vulnerabilities. Do not weaken/delete tests or call the full audit clean; Dallas must update/revalidate the dev dependency chain before that proposed gate can go green. No deployment/CD or live security verification is claimed.

## Next handoff

Keyan: replace the sequential save with reviewed atomic/versioned operations, confirm DTO/error/role mapping and application visibility, publish a verified real driver/branch. Dallas: approve shared/API/CI mapping, supply the isolated A/B setup, fix development audit findings, wire auth/environment and active CI. Steve: run this same conformance suite against that approved driver, then connect actual profile GET/PUT and application pages in a separate reviewed slice. New preparation changes should be a new PR/stack after PR #29 coordination, never a rewrite of #17/#29. This branch is ready for interface review, not production integration sign-off.

## Final local verification — 2026-11-14

Implementation checkpoint: 545e04b (on this preparation branch only). Verified origin/main remains 1ab45e6; read-only GitHub inspection still reports PR #17 head c9ac840 and PR #29 head 317f6dd open/unchanged, PR #28 merged.

| Command/check | Actual result |
|---|---|
| npm ci | PASS; inherited audit findings reported below |
| npm run typecheck | PASS |
| npm test | PASS: 80 tests / 15 files; 21 newly added tests |
| node src/components/ui/student-data/testing/verify-contracts.mjs | PASS: 16 explicit memory-adapter/HTTP contract tests (subset of 80) |
| npm run build | PASS; normal production build |
| npm run smoke (explicit fictional profile/jobs fixtures) | PASS: 56 passed, 6 pre-existing skips; skips are not verified behavior |
| Playwright with testing/playwright.config.ts | PASS: 8 lab tests; 390x844 and 1280x800, light/dark, errors/focus/unsaved close warning, reload and bidirectional two-user HTTP tests |
| node src/components/ui/examples/preview-check.mjs --profile | PASS serial rerun: 7/7; initial concurrent attempt had Windows Chromium spawn UNKNOWN, resolved by serial rerun without assertion changes |
| Manual browser use | PASS: memory profile save/reload, network retry preserving draft, B empty/error/retry, application update/reload/remove and removal focus |
| node src/components/ui/student-data/testing/scan-secrets.mjs | PASS: Secretlint, including generated production/lab browser bundles |
| Production browser bundle lab-marker inspection | PASS: no test-double lab/session alias markers found |
| npm audit --omit=dev --audit-level=moderate | PASS: 0 vulnerabilities |
| npm audit --audit-level=moderate | FAIL: 6 inherited development findings (3 moderate, 1 high, 2 critical); not introduced/remediated by these Steve changes |
| STEVE_LIVE_CONTRACTS=1 verify-contracts.mjs | Expected refusal (exit 1, REAL_ADAPTER_NOT_CONNECTED); NOT live verification |
| NODE_ENV=production STEVE_ADAPTER_LAB=test-double serve-lab.mjs | Expected refusal (exit 1); production lab startup denied |
| git diff --check | PASS |
| Real adapter, Auth/RLS, production durability/isolation, live A/B, deployed CD | NOT RUN: approved atomic driver and configured isolated environment/hosting unavailable |

On this Windows checkout npm is invoked through the existing temporary npm-cli.js because npm is not on PATH. The normal Playwright server uses an ignored local npm shim. The profile harness uses the installed Chromium executable and ignored local evidence directory. These are machine-only tools, not committed dependencies. Secretlint tools live under node_modules/.cache so Playwright output cleanup cannot remove them. Initial scanner-tool cleanup and native warning test orchestration issues were fixed and rerun; no existing assertions were weakened.

### Exact task file inventory (relative to repository root)

These are the task's Steve-owned edits, excluding inherited PR #29 and the safe main merge:

- `assignments/steve-rogers.md`
- `src/app/(student)/profile/adapter-validation.test.ts`
- `src/app/(student)/profile/profile-model.ts`
- `src/app/(student)/profile/ProfileForm.tsx`
- `src/app/(student)/saved/HANDOFF.md`
- `src/app/(student)/saved/SavedApplicationsPreview.tsx`
- `src/app/api/applications/adapter-handlers.ts`
- `src/app/api/profile/adapter-handlers.ts`
- `src/components/ui/HANDOFF.md`
- `src/components/ui/student-data/adapter-contract.ts`
- `src/components/ui/student-data/AdapterEditors.tsx`
- `src/components/ui/student-data/HANDOFF.md`
- `src/components/ui/student-data/http-boundary.ts`
- `src/components/ui/student-data/readiness.ts`
- `src/components/ui/student-data/testing/adapter-contract.test.ts`
- `src/components/ui/student-data/testing/AdapterLab.tsx`
- `src/components/ui/student-data/testing/browser.lab.ts`
- `src/components/ui/student-data/testing/contract-suite.ts`
- `src/components/ui/student-data/testing/http-boundary.test.ts`
- `src/components/ui/student-data/testing/lab-client.tsx`
- `src/components/ui/student-data/testing/lab-server.ts`
- `src/components/ui/student-data/testing/lab-transport.ts`
- `src/components/ui/student-data/testing/memory-double.ts`
- `src/components/ui/student-data/testing/playwright.config.ts`
- `src/components/ui/student-data/testing/readiness.test.ts`
- `src/components/ui/student-data/testing/scan-secrets.mjs`
- `src/components/ui/student-data/testing/serve-lab.mjs`
- `src/components/ui/student-data/testing/steve-adapter-contracts.workflow.yml`
- `src/components/ui/student-data/testing/verify-contracts.mjs`

## Follow-up checkpoint — boundary review at 367cd4f

Current contract tests include a reusable checkedAdapter boundary, pre-write identity/shape checks, input schemas, exact result application/job identity, duplicate application rejection, fixed delete acknowledgements and stable subject checks. HTTP factories reject method/query ambiguity and keep every success/error private/no-store. The local transport reuses that boundary. A/B readiness now accepts only explicit publishable-key format and rejects case/whitespace aliases for the same fictional email. Application-load errors receive focus and retry to an empty list safely.

Regression tests were first observed failing for missing pre-write identity validation, wrong-record responses, ambiguous requests, unsafe readiness and missing error focus; all now pass. No existing tests/skips were weakened. See [exact connection/foundation mapping](INTEGRATION.md) and [package-by-package audit handoff](DEPENDENCY-AUDIT.md). These supersede older counts/notes above without erasing historical evidence.

Latest local results: npm ci PASS; typecheck PASS; npm test **89 tests / 17 files PASS**; verify-contracts.mjs **24 PASS** (subset); production build PASS; normal Chromium smoke **56 PASS, 6 existing fixture skips**; explicit memory lab **9 PASS** at phone/desktop/light/dark; existing profile harness **7/7 PASS**. Manual browser confirmed application load-error focus/retry, profile save/reload in memory, failed application update retaining draft, reset and removal focus/empty state. Secretlint and production audit PASS; full audit remains the inherited 6 findings documented separately. actionlint 1.7.12 -shellcheck= -pyflakes= passes for existing .github/workflows/ci.yml and the owned proposal. Active workflow/package/lockfile/shared AGENTS and production route wiring remain unchanged. Production build bundles contain no lab markers. Real adapter/Auth/RLS/durability/live A/B/deployment remain NOT RUN.

The new PR is preparation/scaffolding only, includes inherited PR #29 fixture files because that PR is still unmerged, and targets main so ordinary CI triggers. It does not update either protected PR/branch. Hosted CI status must be read from the new PR's exact head; deployment is not verified by CI. Owner decisions and unresolved dependencies remain in INTEGRATION.md. Full assignment is not complete.

### Exact follow-up file inventory

- `assignments/steve-rogers.md`
- `src/app/api/applications/adapter-handlers.ts`
- `src/app/api/profile/adapter-handlers.ts`
- `src/components/ui/HANDOFF.md`
- `src/components/ui/student-data/AdapterEditors.tsx`
- `src/components/ui/student-data/checked-adapter.ts`
- `src/components/ui/student-data/DEPENDENCY-AUDIT.md`
- `src/components/ui/student-data/HANDOFF.md`
- `src/components/ui/student-data/http-boundary.ts`
- `src/components/ui/student-data/INTEGRATION.md`
- `src/components/ui/student-data/readiness.ts`
- `src/components/ui/student-data/testing/boundary-regression.test.ts`
- `src/components/ui/student-data/testing/browser.lab.ts`
- `src/components/ui/student-data/testing/checked-adapter.test.ts`
- `src/components/ui/student-data/testing/http-boundary.test.ts`
- `src/components/ui/student-data/testing/lab-transport.ts`
- `src/components/ui/student-data/testing/readiness.test.ts`
- `src/components/ui/student-data/testing/steve-adapter-contracts.workflow.yml`
- `src/components/ui/student-data/testing/verify-contracts.mjs`

Publication: draft PR [#35](https://github.com/Kdixon04/CareerForge/pull/35) targets main. At this documentation checkpoint hosted CI is pending; opening CI run: https://github.com/Kdixon04/CareerForge/actions/runs/43617801983 . Read the PR checks for the latest head before review. No deployment or active security-workflow approval is implied.

## Current follow-up — production boundary preparation (f4a3014)

This section is current; earlier counts/checkpoints below are historical. Safely merged current main fc9efcd into Steve's branch before feature edits (Dallas's job import preparation and bounded request-body work). No independent changes to Dallas/Keyan paths, AGENTS.md, packages/lockfile or active CI. PR #17 head c9ac840 and PR #29 head 317f6dd remain protected/unchanged. PR #35 stays DRAFT; not ready for merge/production sign-off.

**Complete and locally verified:** prepared createVerifiedResolver callback boundary; production test-mode/fictional-header rejection in prepared HTTP handlers; fixed public error reconstruction; shared read/write profile corruption bounds; simultaneous application update/retry conformance; live verification checklist. **Prepared only:** server verifier/ordinary adapter injection and production syntax/origin preflight. These factories are not active Next route exports. **Mocked:** all identity/role/driver acceptance and A/B/reload/concurrency evidence, including tests that deliberately label memory stubs kind=real to exercise boundary acceptance. That label is not real security evidence. **Hosted-CI verified at resume:** old head 9e2fe3b, run 43617849174; new-head CI must be checked after push. **Blocked:** real atomic driver/Auth/RLS/production durability/live A/B/deployment, Keyan/Dallas approvals and environment.

See [INTEGRATION.md](INTEGRATION.md) for exact verifyCaller/connect signatures and environment separation, [LIVE-VERIFICATION.md](LIVE-VERIFICATION.md) for the unexecuted ordinary-user Auth/RLS/rollback/deployment checklist, and [DEPENDENCY-AUDIT.md](DEPENDENCY-AUDIT.md) for the unchanged six inherited findings. PR #28 still supplies SDK client factories, not the missing atomic profile/application driver. Existing sequential main PATCH is preserved and not certified. No changes to production page wiring or test-double fallback.

### Commands and outcomes for this follow-up

On this Windows machine npm commands below were run as node <temporary careerforge-steve-tools/package/bin/npm-cli.js> because npm is not on PATH. The normal smoke server uses the existing ignored npm.cmd shim. Source browser/harness commands use the installed Chromium and ignored toolchain/evidence paths documented above. No machine-specific files are committed.

| Command | Actual outcome |
|---|---|
| git status --short / branch --show-current / remote -v / log / rev-parse | Clean dedicated branch at 9e2fe3b at resume; correct Kdixon04/CareerForge remote |
| git fetch origin; git log HEAD..origin/main; git diff / show | Main advanced to fc9efcd; inspected changes before integration |
| git merge --no-edit origin/main | PASS, clean merge, no conflict/overwrite/reset/rewrite |
| GitHub REST read PR #35 description/comments/files, #17/#29/#28 metadata | PASS; #35 draft, no comments at read time, protected heads unchanged, #28 merged |
| npm ci | PASS, 89 packages installed; inherited six audit findings |
| npm run typecheck | PASS after fixing new tests' readonly NODE_ENV typing/header union via Vi environment stubs and typed computed headers |
| npm test | PASS, **123 tests / 22 files**; 13 new Steve checks + 21 tests from merged main above prior 89 |
| node src/components/ui/student-data/testing/verify-contracts.mjs | PASS, **37 explicit contract/guard tests**, subset of 123, all mocked/stubbed |
| npm run build | PASS, production build |
| npm run smoke with CAREERFORGE_E2E_PROFILE_FIXTURE=1 and CAREERFORGE_E2E_JOBS_FIXTURE=1 | PASS, **56 passed / 6 existing intentional fixture skips**, Chromium |
| node node_modules/@playwright/test/cli.js test --config src/components/ui/student-data/testing/playwright.config.ts | PASS, **9/9**, separate opt-in memory lab, 390/1280 light/dark and errors/isolation/dirty flows |
| node src/components/ui/examples/preview-check.mjs --profile | PASS, **7/7**, existing profile + simulated callback harness, serial |
| Manual browser via loopback lab | PASS, fictional profile save/reload; application denied-save public error/focus + retained draft; retry success/reload retains notes only in memory |
| npm install --prefix node_modules/.cache/steve-security-tools --no-save --no-package-lock secretlint@13.1.0 @secretlint/secretlint-rule-preset-recommend@13.1.0 | PASS, ignored tools only; no project dependency change |
| node src/components/ui/student-data/testing/scan-secrets.mjs | PASS, source/tests/proposal + production/lab browser bundles |
| npm audit --omit=dev --audit-level=moderate | PASS, **0 vulnerabilities** |
| npm audit --audit-level=moderate --json | FAIL, **6 inherited dev findings (3 moderate / 1 high / 2 critical)**; reviewed report without secret values |
| actionlint 1.7.12 -shellcheck= -pyflakes= .github/workflows/ci.yml src/components/ui/student-data/testing/steve-adapter-contracts.workflow.yml | PASS, workflow syntax/types/expressions; no ShellCheck/Pyflakes claim; proposal NOT activated |
| rg lab markers in .next/static JavaScript | No matches (production excludes lab identities/markers) |
| git diff --check / cached --check | PASS before commit |

Focused initial tests were observed failing for corrupt profile reads, mutable public errors and missing resolver behavior, then passed after implementation. No existing assertion, test or documented Chromium skip was weakened/hidden. Tests changing NODE_ENV restore the environment, including inherited CI fixture flags. Full audit is deliberately not marked clean. Actual hosted CI result for the latest head is recorded on PR #35 after it finishes; local results do not imply deployment.

### Files changed in this follow-up (Steve-owned)

- `assignments/steve-rogers.md`
- `src/app/api/profile/verified-resolver.ts`
- `src/components/ui/student-data/adapter-contract.ts`
- `src/components/ui/student-data/AdapterEditors.tsx`
- `src/components/ui/student-data/DEPENDENCY-AUDIT.md`
- `src/components/ui/student-data/HANDOFF.md`
- `src/components/ui/student-data/http-boundary.ts`
- `src/components/ui/student-data/INTEGRATION.md`
- `src/components/ui/student-data/LIVE-VERIFICATION.md`
- `src/components/ui/student-data/readiness.ts`
- `src/components/ui/student-data/testing/contract-suite.ts`
- `src/components/ui/student-data/testing/production-guards.test.ts`
- `src/components/ui/student-data/testing/verified-resolver.test.ts`
- `src/components/ui/student-data/testing/verify-contracts.mjs`

### Subsequent team integration — main 787f6a5

While this task ran, GitHub records walker2023-glitch merged PR #17 at 2026-11-14T17:05:22Z (merge commit 7bb1601); PR #36 integrated it into main 787f6a5. Steve made no PR #17/#29 mutation/merge/rewrite/force-push. #17's original head remains c9ac840, and #29 remains at 317f6dd. Their earlier open-state notes above describe the initial inspection, not current #17 state.

Safely merged the already-integrated main into this branch at 6ee9d23. One conflict was only in src/components/ui/HANDOFF.md; preserved both Steve's adapter note and Dallas's current integration note. No AGENTS.md or shared config/SQL/dependency change. Retained connected profile save props while using the root theme provider; existing sequential PATCH remains unverified/non-atomic.

Re-ran affected checks after this integration: typecheck/build PASS; unit/integration **124/22 files PASS** (the extra unit is main's server-500 handling); explicit mocked contracts **37 PASS**; standard Chromium **64 PASS / 6 unchanged skips**, including all imported Home/Profile theme-navigation cases at 390x844 and 1280x800 in both themes; adapter lab **9 PASS**. Existing profile harness rerun **7/7 PASS**; final Secretlint/bundle marker scan PASS. Full audit remains the same six inherited development findings and production audit is zero; no dependency changes. Prior install/audits remain applicable to the identical package/lockfile; no dependency tree changed. actionlint validation passes again. No new main failure was observed in these checks.

Additional changed file for this follow-up is src/components/ui/HANDOFF.md (merge resolution preserving both notes). Latest exact counts and hosted-head result belong on PR #35; the completed b6449d9 CI run (43619149276) precedes this main integration and must not be presented as verification of a later head. PR #35 stays draft, with real driver/security/durability/live A/B/deployment blocked as documented.

### Final reconciliation — main afcb1c6

Main advanced again with teammate integration PR #37 (f58acc3 / afcb1c6), bringing the saved-preview baseline already present here. GitHub skipped CI for 9c21d32 while that new overlap conflicted. Merged main safely at 33c5028; the only content conflict was the saved-preview banner. Combined both truthful disclosures: this preview is disconnected from account/saved application records, resets on reload, and checking/removing/resetting never writes an account. This avoids implying global sign-in is absent. Steve did not invoke any PR #17/#29 merge, edit, force-push or rewrite; their original head SHAs remain unchanged. External team integration is distinct from Steve's actions.

Final local results after this merge/banner resolution: typecheck PASS; **124 unit/integration / 22 files PASS**; explicit mocked contracts **37 PASS**; production build PASS; Chromium **64 PASS / 6 unchanged intentional skips**. The unchanged adapter lab and profile harness last reruns passed **9/9 and 7/7** respectively after the theme integration; only the separate /saved banner and handoff wording changed afterward. Scans/audits/workflow validation retain the limits above. No package/lockfile, Auth/RLS implementation or production adapter was added. No new failure versus main was observed. Current-head hosted CI must run after this conflict-free reconciliation; earlier green heads do not certify it.

Additional task paths touched by reconciliation: src/app/(student)/saved/SavedApplicationsPreview.tsx (combined truthful banner), src/app/(student)/saved/HANDOFF.md (preserved team's integration note). All underlying fixture/Card/Badge/test logic was preserved. The PR diff is now adapter preparation over the team's integrated preview, rather than a duplicate preview PR. Requirements/approval/live environment blockers and DRAFT status are unchanged.

## Permission-gated compatibility check — tests/documentation only

User approved a read-only comparison, the focused test/handoff step, full type/unit/contract validation, and then recording those results and committing exactly these two files locally. No production behavior, routes, adapters, dependencies or CI configuration changed. Pushes, PR metadata edits and teammate messages remain unauthorized for this step and were not performed. Existing historical counts and hosted green head 5f3f202 above do not include this local test addition.

Added testing/timestamp-compatibility.test.ts: three explicitly MOCK tests check that UTC versions 2026-11-14T12:00:00.123456Z / .123457Z / .123458Z remain distinct and unchanged across checked-adapter reads/consecutive writes, prepared profile GET/PUT including a stale same-millisecond retry, and application GET/POST/PATCH. Outgoing expectedUpdatedAt values and incoming updatedAt values are asserted exactly; private no-store responses are retained. The stub decides conflicts by exact string comparison. This is consumer/transport compatibility evidence only, not proof of a database transaction, genuine timestamps, Auth/RLS or persistence.

Focused command: node node_modules/vitest/vitest.mjs run src/components/ui/student-data/testing/timestamp-compatibility.test.ts — **3/3 PASS**. Initial run had 2 passes / 1 test setup failure because Vitest 2.1.3 lacks toHaveBeenCalledExactlyOnceWith; changed to an exact mock.calls equality assertion, then all passed. No existing tests were changed or weakened. Subsequently authorized validation: npm run typecheck PASS; npm test PASS (127 tests / 23 files, including all 3 new timestamp tests); node src/components/ui/student-data/testing/verify-contracts.mjs PASS (37 existing explicitly mocked contract/guard tests, a subset of the 127). The unchanged explicit runner does not separately select the new timestamp file; full unit discovery and its focused command cover it. npm commands used the existing temporary npm-cli.js because npm is absent from PATH. Production build/browser/scans were not rerun for this test/documentation-only step; prior results remain historical.

Read-only comparison findings (GitHub main inspected at 60d23d6; local branch remains 5f3f202):
- PR #28 at 1693c90 supplies createSupabaseBrowserClient() and async createSupabaseServerClient(). Their names, async server signature, public configuration names and UUID subject mapping align with Steve's preparation. It contains no atomic profile/application adapter to wire. Current main still has no src/lib/data implementation.
- Active profile PATCH differs from prepared GET/PUT, uses error:string rather than the structured public error envelope, rounds versions through JavaScript Date and writes profile/delete-facts/insert-facts separately. Existing source matches current main. Prepared precision tests pass without changing that active route and do not certify it.
- Keyan must publish approved atomic profile/application operations and trusted session/role mapping. Dallas/Keyan must agree on API/error/concurrency mapping, initial blank profile versus Student display-name fallback, authorized application summaries and the exact canonical timestamp representation. Proposed schemas currently accept UTC Z strings; do not introduce offset conversion or truncate precision without the agreed mapping.
- Concrete runtime mismatch: committed @supabase/supabase-js 2.119.0 declares Node >=22.0.0, but active .github/workflows/ci.yml selects Node 20. Existing green CI is not evidence that Node 20 meets that SDK's supported engine. Dallas owns the runtime/CI/dependency decision; the inactive proposal already selects Node 22. No owner files were edited.
- PR #35 remains draft with no comments/reviews at inspection. Missing atomic adapters and isolated live environment remain blockers; mocked compatibility is not live saving/security/A-B/deployment verification.

Files approved for the local commit: this HANDOFF.md and testing/timestamp-compatibility.test.ts only. Further edits, push/PR updates or teammate communications require the user's next permission. These passing mocked checks do not remove the live backend/environment blockers or change PR #35's draft status.

## Authorized coordination requests — November 14, 2026

User explicitly authorized sending these requests and recording evidence/status. This supersedes the earlier permission-limited/unsent-message checkpoint without changing the live verification gate.

- Rechecked #17 c9ac840 and #29 317f6dd: both already merged by walker2023-glitch; original-head CI checks pass. No approval/merge action, rewrite or force-push was performed by Steve. Their scoped theme/fictional-preview work is already integrated; it does not establish persistence.
- Sent [Keyan request](https://github.com/Kdixon04/CareerForge/pull/35#issuecomment-6883504576) at 2026-11-14T20:09:09Z for approved atomic profile/application interfaces, implementation branch/commit, exact API/error/concurrency contract and verified-user/role boundary.
- Sent [Dallas request](https://github.com/Kdixon04/CareerForge/pull/35#issuecomment-6883504773) at 2026-11-14T20:09:10Z for isolated environment, Auth/RLS and fictional Student A/B setup, security CI approval, six-vulnerability remediation plan and Node 22+/current Node 20 CI decision. Credentials must remain in protected configuration, not comments. No CI/dependency files were changed.
- Credit existing backend work: #19/#30/#31/#32 are merged. #31 reports manual save/refresh persistence and #32 reports authenticated published-job reads; these are the author's reported results, not Steve's independent live verification. Current profile PATCH still writes profile/facts separately; approved atomic profile/application operations remain the precise connection request.
- Local configuration inspection found no .env files or required Supabase URL/publishable-key settings in Steve's checkout/process/user/machine environment. No values were printed, no sign-in attempted, and no account writes performed. The running website demo remains explicitly fictional preview mode.
- Latest runtime-code checkpoint 572dc61: typecheck and 127 unit tests/37 explicit mocked contracts passed locally; hosted ordinary CI passed in run 43624232341. This new step is documentation/coordination only, with link/status verification and git diff checks; no new live/Auth/RLS/A-B/deployment evidence or dependency audit is claimed.
- Steve-owned review follow-up remains open: application reload during a pending save/removal can clear items before a stale callback uses map/filter. Fix with a focused regression test before connecting the real UI; it was reported, not silently fixed in this coordination step.

Next gate: obtain the actual approved adapter signatures/branch and isolated environment configuration, confirm exact DTO/version/error/role mapping, then connect and run LIVE-VERIFICATION.md end to end with ordinary fictional users. Record request/response and unchanged stored state on denial, precision/conflict/rollback evidence, reload/new-session durability, both viewport/theme journeys, A/B and deployed checks. Only completed real checks count toward readiness. PR #35 stays DRAFT; no production-persistence fallback, inactive security-workflow activation or full-assignment completion claim is authorized by mocked results.

## Local application reload/mutation race fix — awaiting commit permission

User approved fixing Steve's reviewed reload/save race and adding regression coverage. These edits are LOCAL and uncommitted; no push, PR update, teammate message or deployment was performed. Published PR #35 at 72c4bf7 still has the previously reviewed code until a later approved commit/push. No approved real adapter or live environment was connected.

Root cause: dirty=false did not mean idle. An unchanged application could have a save/removal in flight while the parent reload/add/user controls remained enabled. Clearing the list for a reload could leave an old callback calling map/filter on null.

Fix: track pending application IDs separately from dirty state, expose optional onBusyChange for parent controls, guard reload synchronously while any mutation is pending, and disable reload while loading. Each row clears pending state after success/failure and on unmount; a synchronous row guard prevents duplicate starts. Nullable list updates safely retain loading state if a late callback arrives after the list clears. The isolated lab uses busy state to disable its identity selector/add action, which can remount the list. Independent rows can still update; finishing one does not release another row's lock. Error retry and successful removal's reload-button focus are retained.

Regression evidence: the four update/remove x success/error Chromium cases FAILED before the fix because Reload applications remained enabled. After fixing, these four plus a two-row pending-write case pass. All five use held/intercepted requests and fictional memory data only; no real authentication, RLS, database concurrency or durability is demonstrated.

Commands/results for this local step:
- node node_modules/@playwright/test/cli.js test --config src/components/ui/student-data/testing/playwright.config.ts --grep 'pending application': initial 4 FAIL (expected missing busy lock), then 4 PASS after implementation.
- npm run typecheck: PASS (via existing temporary npm-cli.js on this machine).
- npm test: 127 PASS / 23 files; no existing assertions/tests weakened.
- node src/components/ui/student-data/testing/verify-contracts.mjs: 37 PASS, explicitly mocked contracts/guards (subset of 127).
- Full Playwright lab command above without --grep: 14/14 PASS, including existing 390/1280 light/dark save/reload/isolation/error/unsaved flows and the 5 new race cases.
- Read-only in-memory hook diagnostic on actual component source: late update and remove callbacks with a null list no longer throw; this diagnostic is not a full React/browser test or live security evidence.
- npm run build: PASS.
- node src/components/ui/student-data/testing/scan-secrets.mjs: PASS, including generated production/lab JavaScript.
- Manual loopback browser lab: unchanged delayed update/removal visibly locks reload, add and identity controls; reload error receives focus; retry works; successful removal shows empty state and focuses reload. Lab server stopped after use; public fictional demo on port 3000 retained.
- git diff --check: PASS. Existing full audit findings/security CI approval/live environment blockers are unchanged; no fresh dependency audit or hosted CI run is claimed for uncommitted changes.

Changed files: src/components/ui/student-data/AdapterEditors.tsx; src/components/ui/student-data/testing/AdapterLab.tsx; src/components/ui/student-data/testing/browser.lab.ts; this HANDOFF.md. No auth/SQL/shared contract/package/workflow edits. Commit and push require the user's next permission; PR #35 must remain draft.

## Local main reconciliation — November 14, 2026

With Steve's approval, merged origin/main a32c4e4 into the working tree after pushed fix d01c89e, using --no-commit; merge commit and push still await permission. The only conflict was SavedApplicationsPreview.tsx: retained main's shared RootShell navigation/theme and Steve's complete explicit no-account-writes disclosure. Shared AGENTS.md, teammates.md, dependencies and active CI match imported main exactly; no independent edits to other owners' work.

Checks on the merged tree: typecheck PASS; npm test 256 PASS / 1 existing live skip; explicit mocked adapter contract checks 37 PASS; production build PASS; Chromium smoke 88 PASS / 8 existing skips (6 profile callback-harness cases and 2 unconfigured live DB cases); mocked adapter lab 14 PASS including 5 pending-mutation regressions; Secretlint source and production/lab bundles PASS. Home/Profile navigation, switching and reload passed at 390x844 and 1280x800 in both themes through automated Chromium. No new manual browser run or live account/database/deployment verification in this reconciliation. Install and dependency audit not repeated: package/lockfile unchanged by this merge. Previously recorded six development vulnerabilities remain unresolved.

Diff against origin/main passes git diff --check. Full staged merge diff against the older branch reports whitespace already present in imported main documentation and prep-handlers.ts; preserved rather than editing other owners' files. No tests weakened or deleted by Steve. PR #35 remains draft; hosted CI cannot verify the local reconciliation until a separately approved commit/push. Next: approve merge commit, then approve push and wait for hosted CI. Atomic adapter approval, isolated A/B credentials/Auth/RLS setup, security CI approval and live deployment evidence remain owner handoffs, not completed claims.

## Published reconciliation and blocker recheck

Merge 3c83049 was pushed with Steve's authorization; the prior uncommitted checkpoint is now historical. CI started on that exact head. Local checks remain those recorded above. Remote main e3996ec adds coordination documentation after a32c4e4; it still has no src/lib/data atomic profile/application implementation. Existing owner requests have no replies at this check. Required Supabase and fictional A/B process configuration is absent; only .env.example exists locally. No real integration or live verification was attempted. Fresh npm audit: 6 development findings (2 critical, 1 high, 3 moderate); npm audit --omit=dev: 0. No package/lockfile changes. Keep PR #35 draft and record final hosted CI separately.
