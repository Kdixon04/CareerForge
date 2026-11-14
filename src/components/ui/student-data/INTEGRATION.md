# Adapter compatibility and connection handoff

Owner: Steve. Inspected main 1ab45e6, merged PR #28 head 1693c90, preparation checkpoint 367cd4f. This is a consumer proposal, not a verified production driver.

## Actual foundation versus prepared consumer

| Area | Actual repository foundation | Prepared consumer / required mapping |
|---|---|---|
| Browser client | createSupabaseBrowserClient() in src/lib/supabase/client.ts | Use existing client; do not create another Supabase client implementation |
| Server client | async createSupabaseServerClient() in src/lib/supabase/server.ts; cookie-aware | Resolve per request; verify caller with supported Auth API, enforce trusted student role, use ordinary session/RLS client |
| Profile identifier | profiles.id = Auth user.id; DB facts have user_id | DTO profile.userId = verified subjectId; fact DTO intentionally omits ownership; reject moving fact IDs |
| Profile read/write | Current profile page reads tables; PATCH route writes profile/delete facts/insert facts sequentially | getProfile(): Promise<Profile>; putProfile(ProfileWrite): Promise<Profile>; full transaction + full-precision compare-and-swap required |
| Profile input | PATCH uses expectedUpdatedAt; rounds stored time through Date milliseconds | Proposed GET/PUT preserves version as opaque ISO string; no browser userId/role accepted |
| Profile read defaults | Active route falls back to Student for empty name | Prepared read permits empty name; writes require nonblank name. Keyan/Dallas approve empty-profile provisioning/default mapping |
| Error shape | Active PATCH has error:string, 409/500; errors are not the common envelope | Prepared {error:{code,message}}, fixed generic messages; map known driver errors, never raw DB error text |
| Applications | No approved application adapter in src/lib/data | Proposed methods below; authorized summary nested under application.job or null |
| Application DTO | Shared SavedApplication has tracking fields only | Consumer extends it with safe authorized job summary; no employer/student PII. Dallas approves summary shape |
| Concurrency | Existing PATCH check then separate writes is racy/non-atomic | Atomic profile/facts replacement; stale version 409; exactly one concurrent winner. Proposed expectedUpdatedAt on app PATCH needs Dallas/Keyan approval |
| HTTP adoption | Active profile route is PATCH; prepared modules are not Next route exports | Steve switches only after approved driver + real conformance. No mock fallback; unavailable resolver returns 503 |

## Exact proposed driver surface

Source of truth for this proposal: adapter-contract.ts runtime schemas and StudentDataAdapter. Reuse schemas; do not hand-copy competing DTO definitions.

```ts
interface StudentDataAdapter {
  readonly kind: 'test-double' | 'real'; // A label, not security proof.
  readonly subjectId: string;          // Verified Auth subject UUID; stable per session.
  getProfile(): Promise<Profile>;
  putProfile(input: ProfileWrite): Promise<Profile>;
  listApplications(): Promise<Application[]>;
  saveApplication(input: {jobId: string}): Promise<Application>;
  patchApplication(id: string, input: ApplicationPatch): Promise<Application>;
  removeApplication(id: string): Promise<{id: string}>;
}
```

ProfileWrite is exactly displayName, nullable field, facts, expectedUpdatedAt. ApplicationPatch is one or more of status/deadline/notes plus expectedUpdatedAt. IDs are UUIDs. UpdatedAt remains the server's exact timestamp/version. Existing HANDOFF.md documents the full validation/status/error matrix, relationships and endpoint mapping.

Keyan supplies the atomic, user-scoped operations and ordinary A/B/anonymous/employer harness. Steve wraps the approved mapping with checkedAdapter(source), supplies the server ResolveAdapter to createProfileHandlers/createApplicationHandlers, and injects the browser transport into the editors. checkedAdapter validates inputs before invoking a driver, checks subject and response schemas, binds PATCH/POST results to requested application/job IDs, rejects duplicate application IDs/jobs and sanitizes delete acknowledgements. Prepared HTTP handlers require exact methods, no query parameters, matching mutation Origin and private no-store errors/success. These guards cannot undo a broken driver's partial write or establish authorization themselves.

Never implement ResolveAdapter using x-lab-user, request userId, service-role assertions, or kind=real as an authorization decision. Session/role enforcement and RLS remain Keyan's responsibility; missing configuration remains unavailable. Retain server-only auth in the resolver: cookie-aware Supabase factories must not be imported into client editors. Real network transports must send same-origin credentials, use no-store fetches and map the documented envelope to AdapterError. No production transport is invented here.

Before route adoption: run studentAdapterContract against ordinary fictional clients in the isolated environment; verify DB state after denied/failed writes and reload/new session; exercise session expiry, student/employer role checks, direct Data API/RPC isolation, atomic rollback and version precision. Only then connect actual pages and rerun integrated browser flows. Parent SPA navigation must integrate a dirty-leave decision; the prepared editors currently guard native unload and their own reload/reset controls, and the separate lab disables identity switching while dirty. Production Next navigation is not certified by the lab.

## Dallas decisions and exact environment requirements

- Approve GET/PUT adoption, conflict/error mapping, safe job-summary shape, initial profile defaults and application expectedUpdatedAt semantics before promoting this proposal into shared contracts.
- Provide a separate Supabase test project with approved migrations/grants/RLS and fictional student A/B plus employer account(s), ordinary sign-in/session setup, approved test reset/provisioning and no production data. Credentials remain local/protected CI environment, never in Git/chat.
- Required readiness names: STEVE_LIVE_CONTRACTS=1, STEVE_ISOLATED_PROJECT=yes, NEXT_PUBLIC_SUPABASE_URL (HTTPS origin), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_ format only), E2E_STUDENT_A_EMAIL/PASSWORD, E2E_STUDENT_B_EMAIL/PASSWORD. Distinct emails are compared case-insensitively after trimming. Legacy JWT keys require a separate approved validation strategy; no arbitrary JWT/secret key is accepted by this readiness check. Complete values still report real-driver-required; they do not enable writes.
- Confirm runtime/Node version, approved auth callback/redirect URLs, APP_URL/origin handling behind the deployment proxy, hosting project access/environment and actual preview URL. These are required before live/deployed checks.
- Approve/copy testing/steve-adapter-contracts.workflow.yml into the owned active workflow location, or add its steps to existing CI. Existing ci.yml already triggers PRs targeting main and main pushes and discovers new unit contracts. Proposal also triggers both events, uses Node 22, read-only permissions, no live secrets, explicit mock browser lab, full+production audits and Secretlint. Local actionlint 1.7.12 validation passes for both files; ShellCheck/Pyflakes are not included in that validation. Proposal is NOT hosted CI. Review overlapping smoke jobs before activation.
- Upgrade/revalidate the inherited development dependency chain; see DEPENDENCY-AUDIT.md. Do not remove the failing full-audit gate to obtain green results.

No full assignment, production persistence/isolation, live security, A/B experiment or deployment sign-off is given by this handoff.

## Prepared verified resolver — production guards (not activated)

src/app/api/profile/verified-resolver.ts exports createVerifiedResolver({environment?,verifyCaller?,connect?}) for BOTH prepared handler families. It has no Next route export and no Supabase/Auth implementation. Keyan's verifyCaller(Request) must return null for missing/expired identity or {subjectId,role} from supported Auth verification + trusted role storage. connect(verifiedCaller,Request) must return a fresh ordinary-session/RLS StudentDataAdapter whose subject matches that caller; it must never return the memory harness or a privileged service-role client. No identity/adapter is cached across requests.

The factory requires production configuration preflight, rejects browser invocation, fictional session/fault headers, wrong canonical request origins, wrong roles/identities, declared test doubles and mismatched driver subjects. Prepared HTTP factories additionally reject declared doubles/test flags/fictional headers when NODE_ENV=production even if a resolver is injected directly. These guards are consumer preparation, not evidence that any real verifier/driver is approved. A mislabeled driver cannot be detected as genuine by a kind string; owner review plus live ordinary-user tests remain mandatory.

productionConfigurationIssues(environment) is a pure syntax/configuration preflight returning variable NAMES only: NODE_ENV must be production, APP_URL and Supabase URL must be bare HTTPS origins, key must have publishable format, and all four test flags must be unset: STEVE_ADAPTER_LAB, STEVE_LIVE_CONTRACTS, CAREERFORGE_E2E_PROFILE_FIXTURE, CAREERFORGE_E2E_JOBS_FIXTURE. Even nonempty '0'/'false' is rejected to avoid ambiguous production settings. It makes no DNS/Auth/hosting/credential-validity call and is not a deployment probe. Dallas must approve environment/origin handling before activation. Test-runner live flags belong in a separate process, never deployed runtime configuration.

publicAdapterError reconstructs fixed public messages/status from recognized codes and rejects unknown codes. HTTP/UI no longer trust mutable adapter Error.message/status. Read and write profile schemas now share unique-fact and combined-length constraints; corrupted responses cannot render duplicate fact identities or oversized aggregate facts. Contract coverage includes simultaneous application updates with exactly one winner, stale retry and unchanged other-user state.

Before any real route adoption use [LIVE-VERIFICATION.md](LIVE-VERIFICATION.md), whose items are all NOT RUN until evidence is recorded. Existing active main PATCH remains unchanged and non-atomic; the new resolver does not certify or silently replace it.
