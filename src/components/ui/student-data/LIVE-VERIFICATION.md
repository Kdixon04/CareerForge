# Live verification checklist — NOT RUN

Owner: Keyan (Auth/adapters/database), Dallas (isolated environment, CI, hosting), Steve (consumer routes/UI). This checklist is a gate, not evidence that any item passed. Keep PR #35 a draft. No real production/user data, privileged assertions, permission weakening or destructive production resets.

## Before running

- [ ] Keyan publishes approved getProfile/putProfile/listApplications/saveApplication/patchApplication/removeApplication mapping, branch/SHA and transaction/version/error/role/visibility semantics. Reuse adapter-contract.ts + checkedAdapter; no competing SQL/schema.
- [ ] Dallas approves GET/PUT, error/status/concurrency fields, empty-profile defaults and job summaries; supplies an isolated Supabase project with approved migration/grant/RLS state and disposable fictional A/B/employer accounts. Record project label and migration IDs, never keys/passwords/tokens.
- [ ] Use ordinary A/B, anonymous and employer sessions for assertions. Privileged setup may provision fixtures/roles only, through Keyan's approved test setup. Ensure both directions use distinct Auth UUIDs and distinct canonical emails.
- [ ] Configure protected test-runner environment: STEVE_LIVE_CONTRACTS=1, STEVE_ISOLATED_PROJECT=yes, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, E2E_STUDENT_A/B_EMAIL/PASSWORD; employer credential names follow AGENTS.md. No production data or keys in Git/chat/screenshots.
- [ ] Keep the deployed server environment separate: NODE_ENV=production, approved canonical HTTPS APP_URL, Supabase HTTPS origin + publishable key, no STEVE_ADAPTER_LAB/STEVE_LIVE_CONTRACTS or CAREERFORGE_E2E_* fixture flags. Live-runner flag is never sent to or enabled on the production server. Current verify-contracts.mjs deliberately refuses live execution until an approved harness is connected.
- [ ] Dallas confirms callback/redirect URLs, cookie/session behavior, canonical request URL handling behind the host/proxy and preview access. createVerifiedResolver rejects destination origins differing from APP_URL; it does not trust forwarded headers. Approve a correct platform bridge rather than loosening this check.

## Auth, roles, HTTP and exposure

- [ ] Real cookie/JWT verification: signed-out, expired, invalid and revoked sessions cannot read or write. Employer/admin cannot use student mutations. Role comes from trusted server data; signup/user metadata cannot elevate it.
- [ ] Missing verifier/driver/configuration, declared test-double drivers, mismatched driver subject and accidental test flags fail closed. Fictional x-lab-user/x-lab-fault aliases are rejected even with an otherwise valid session. A kind=real label is not an Auth attestation.
- [ ] Every private success/error has private no-store and correct Vary; no browser/CDN cross-user cache. Mutation Origin and canonical destination checks reject foreign/missing origins. Do not infer this from a browser-only cache bypass.
- [ ] Invalid bodies, unknown ownership/provenance keys, malformed IDs, invalid calendar dates and excessive input cause no changes. Errors show fixed public messages/status, never DB diagnostics/another user's facts or credentials.
- [ ] Direct ordinary Data API/RPC access cannot bypass UI routes: A/B cannot read/update/delete/upsert the other's profiles/facts/private jobs/apps/resumes; facts cannot move owners. Inspect both returned rows and unchanged stored state. Repeat with roles/provenance/immutable-column escalation attempts. Keyan owns SQL/security assertions.

## Atomicity, relationships, persistence and retries

- [ ] Atomic profile+facts save: valid replacement survives new client/session and server restart; empty facts/removals remain empty. An induced mid-write failure in the isolated environment leaves the entire old profile/facts unchanged. Keyan supplies safe failure/recovery mechanism; Steve does not invent SQL/faults in production.
- [ ] Preserve full timestamp precision. Concurrent saves of the same version have exactly one winner and 409 for the other; stale retry cannot overwrite. Test ambiguous network failure after commit, fetch latest explicitly and preserve the user's draft until a decision. No silent conflict retry.
- [ ] A and B each read their own profile only; forged ownership/profile/fact IDs do not change either profile. Repeat in both directions; test direct calls as well as route/UI.
- [ ] Applications: own private/published job access, foreign private job denial, unique caller/job under concurrent/repeated saves; correct application ID/job ID in response, immutable ownership/relationship on PATCH, personal deadline/notes validation, version conflict, idempotent own unsave and non-revealing absent/foreign acknowledgement. Confirm foreign deletion does not remove the owner's row.
- [ ] Published -> paused remains inactive for existing savers, hidden content becomes null while tracking remains; no leaked job/profile details. Resume fact snapshots remain immutable after profile edits. Employer stats expose counts only and current saves count correctly. Coordinate these wider checks with Keyan/Dallas.

## Browser, deployment and evidence

- [ ] Signed out -> real sign-in -> profile/facts save -> navigate/reload -> new session -> edit/remove -> reload -> same facts. Then save a real authorized test job -> edit application/status/reminder/notes -> reload/new session -> unsave. No localStorage personal data.
- [ ] Phone 390x844 and desktop 1280x800, both themes: loading/empty/errors/retry/reset, labels/keyboard/focus, unsaved navigation/native unload, expiry, concurrent edit and failed save preserve drafts. Parent SPA navigation must use dirty state; current lab cannot certify production Next navigation.
- [ ] Dallas activates reviewed CI/security proposal, remediates inherited development dependencies and records install/typecheck/unit/contracts/build/smoke/lab/profile/scans/audits on the exact commit. Hosted ordinary CI alone does not prove the inactive proposal ran.
- [ ] After actual hosting/env access exists, run the same ordinary-user journey at the deployed preview URL and verify redirects, runtime/timeouts, no test flags and no secrets in browser bundles. A local build or syntax preflight is not deployment verification.
- [ ] Evidence records exact SHA, date, nonsecret environment label/migrations, ordinary role/account aliases, command, expected/observed result, DB unchanged-state check, and limitations. Only mark individual items passed with that evidence. Cleanup only approved disposable fixtures; keep failures/blockers explicit. Separate sign-offs for live saving, Auth/RLS isolation, experiment A/B (if actually performed), CI and deployment.
