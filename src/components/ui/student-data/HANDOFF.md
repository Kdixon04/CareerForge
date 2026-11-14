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
