# Career Forge — shared agent instructions

Before editing, read this file completely, the current [team handoff](teammates.md), and your owner's file in [assignments/](assignments/). AGENTS.md defines shared rules and file ownership; teammates.md records the current handoff and cross-person dependencies; your owner's assignment defines that person's work. Human instructions take precedence. Recheck teammates.md at the start of each work session and when integrating another person's changes. These documents describe the agreed implementation target; they do not claim the application already exists. Resolve security or shared-contract conflicts with the relevant owner; continue independent work while blocked. Record small reversible assumptions in your handoff instead of stopping for every detail.

## Mission, scope, and current state

Career Forge helps students across career fields turn their experience into real opportunities and truthful applications. Our theme framing is reinventing the resume and career center; organizer approval of that framing is unconfirmed. BYU-Idaho Career Center (https://www.byui.edu/career/) is a product-research reference, not evidence of partnership, endorsement, or access to its job data.

Required student journey: sign in -> enter experience -> discover a real job or paste a description -> inspect matching evidence and gaps -> edit and save resume suggestions -> save an application and change its status -> reload and retain edits. Live discovery through Claude is the preferred path; pasted jobs are a usable fallback and clearly labeled. Students enter their own skills; no special role exists for each major.

Build the minimal employer journey concurrently: employer creates a draft, publishes/pauses its own listing, and sees its own views/saves. Integrate it as soon as dependencies are ready; do not hold Keyan idle until the student journey is complete. If time forces a cut, Dallas and Keyan record it explicitly. The admin role exists for trusted maintenance; a custom admin UI is stretch, owned by Keyan. Teachers/mentors are later.

Repository inspected on November 13, 2026: main at a48fcbe36ad65039571a31f671ff63fc2c94beac contained only supabase_instructions.txt and test-knock-knock.txt. Reinspect before implementation; teammates may have newer work. Existing Supabase work belongs to Keyan. Preserve and reconcile it rather than starting another schema. The old setup prompt is historical context; these instructions govern current coordination. Its instruction about not sending real data to an AI applies to database setup/debugging, not the user-consented runtime resume feature.

## People and ownership

| Owner | Assignment | Responsibility |
|---|---|---|
| Dallas | [assignments/dallas.md](assignments/dallas.md) | Scaffold, shared contracts, Claude/search/resume, integration, Vercel |
| Keyan | [assignments/keyan.md](assignments/keyan.md) | Supabase schema/migrations/RLS, database adapters, employer features, security tests |
| Steve Rogers | [assignments/steve-rogers.md](assignments/steve-rogers.md) | Profile and saved-application UI/API wiring, design system, navigation, light/dark themes |
| Will | [assignments/will.md](assignments/will.md) | In-app calendar, internship deadlines/reminders, external calendar export, professional contact follow-ups after data handoff, demo and user-flow QA |

One writer per file at a time. Review ownership is not exclusive implementation ownership: Dallas reviews shared changes while Keyan implements SQL and Steve implements his routes. Owners can delegate a precise path/task to another agent in an isolated checkout after announcing the handoff; record who currently holds it. Do not create overlapping implementations.

| Paths (each path is literal; ** means descendants) | Owner |
|---|---|
| AGENTS.md, teammates.md, assignments/dallas-agent-coordination.md, README.md, src/contracts/**, src/lib/claude/**, src/lib/jobs/** | Dallas |
| src/app/layout.tsx, src/app/page.tsx, src/app/(auth)/** | Dallas |
| src/app/(student)/jobs/**, src/app/(student)/match/** | Dallas |
| src/app/api/jobs/**, src/app/api/resume/** | Dallas |
| package.json, lockfile, .gitignore, .env.example, framework/test/deploy config, .github/** | Dallas |
| supabase/**, src/lib/supabase/**, src/lib/data/**, tests/security/** | Keyan |
| src/app/employer/**, src/app/api/employer/**, src/app/api/events/** | Keyan |
| src/app/admin/**, src/app/api/admin/** (stretch only) | Keyan |
| src/app/(student)/profile/**, src/app/(student)/saved/** | Steve |
| src/app/api/profile/**, src/app/api/applications/** | Steve |
| src/components/ui/**, src/components/nav/**, src/components/theme/**, src/styles/**, src/app/globals.css, public/brand/** | Steve |
| tests/e2e/dallas-*.spec.ts, tests/unit/dallas-*.test.ts | Dallas |
| tests/e2e/keyan-*.spec.ts, tests/unit/keyan-*.test.ts | Keyan |
| tests/e2e/steve-*.spec.ts, tests/unit/steve-*.test.ts | Steve |
| src/app/(student)/calendar/**, src/lib/calendar/**, src/app/api/calendar/** | Will |
| src/app/(student)/contacts/**, src/lib/contacts/**, src/app/api/contacts/** (after Keyan/Dallas data handoff) | Will |
| tests/e2e/will-*.spec.ts, tests/unit/will-*.test.ts, demo/** | Will |

Each person owns updates to their assignment; shared ownership/contract changes go through Dallas. Avoid edits to unclaimed shared paths until an owner is recorded.

## Architecture and first handoff

Default: Next.js App Router + TypeScript, Supabase PostgreSQL/Auth, Claude server-side, Vercel. Keep an existing working stack if later repo inspection finds one; coordinate path changes first. Prefer existing SDKs and React state over another framework. No ORM, vector database, autonomous agent framework, or background worker is required for MVP.

First 30–60 minutes: Dallas creates one scaffold, scripts, contracts and fictional fixtures; Keyan reports his existing schema and aligns migrations/adapters with those contracts; Steve drafts themes/components against fixtures; Will drafts the demo story and missing-decision checklist. Publish a runnable baseline early. Match the actual lockfile and runtime supported by the chosen Next.js/Vercel versions.

Expected scripts to add to package.json during scaffold (targets, not commands already verified): dev, build, typecheck, lint, test:unit, test:security, test:e2e. After scaffolding, README must contain actual prerequisites, install command, environment setup, commands and deployment steps. Never report a target script as already present or passing.

Authentication: Keyan supplies cookie-aware browser/server Supabase clients; Dallas connects sign-in/sign-out and auth callbacks. Steve and Keyan use those shared clients. Server routes verify the caller through the supported Auth verification API, derive identity from the verified session, then use a user-scoped client so RLS applies. Never authorize from a browser-supplied userId/role. Keyan publishes database adapters in src/lib/data; each feature calls those rather than inventing its own SQL shape.

## Routes and contracts v1

Freeze actual Zod schemas/inferred TypeScript types in src/contracts after Dallas/Keyan reconcile the first schema. API uses camelCase; database uses snake_case; adapters perform conversion. Runtime schemas—not duplicated interfaces—are the source of truth. All identifiers are UUID strings unless marked otherwise; timestamps are UTC ISO strings; nullable values below are explicit nulls.

Public page paths: /profile, /jobs, /jobs/[id], /match/[id], /saved, /employer/jobs, /employer/jobs/new, /employer/jobs/[id]. Next.js route groups such as (student) do not create URL segments. Keep the literal employer/ directory; never create a second /jobs page in an (employer) group.

Contract shapes:
- StudentFact: { id, kind: skill|education|project|experience|interest, text, dates: string|null, org: string|null }.
- StudentProfile: { userId, displayName, field: string|null, facts: StudentFact[], updatedAt }.
- JobType: internship|full_time|part_time|co_op|contract|unknown.
- WorkMode: remote|hybrid|on_site|unknown.
- JobSource: pasted|claude_web|employer|provider.
- JobSearchQuery: { keywords, careerField: string|null, location: string|null, jobType: JobType, workMode: WorkMode }; validate lengths.
- JobDraft: { title, company, description, location: string|null, jobType, workMode, sourceUrl: string|null, deadline: string|null }. Used as input; it carries no trusted ownership, status, verification or persisted id.
- JobPosting: JobDraft + { id, source: JobSource, providerName: string|null, externalId: string|null, createdByUserId, employerId: string|null, status: private|draft|published|paused|hidden, retrievedAt: string|null, deadlineVerified: boolean, createdAt, updatedAt }.
- EmployerJobInput: editable JobDraft fields + status restricted to draft|published|paused; ids, employer association, source and verification are server-controlled. HTML form validation uses this input schema, not the complete persisted JobPosting schema.
- MatchResult: { jobId, matches: [{ requirement, factIds: string[] }], gaps: [{ requirement, note }] }.
- ResumeVersion: { id, userId, jobId, generatedBullets: [{ id, text, evidence: string[], targetsRequirement }], editedBullets: [{ id, text }], match: MatchResult, factSnapshot: StudentFact[], createdAt, updatedAt }. Generated bullets/snapshot are immutable through ordinary edit endpoints; edited text is student-authored and not automatically fact-checked.
- SavedApplication: { id, userId, jobId, status: saved|applied|interviewing|offer|rejected, deadline: string|null, notes, updatedAt }. Deadline here is a personal reminder override; it does not verify or change the listing deadline.

Date-only deadlines/reminders use YYYY-MM-DD, not a made-up UTC instant. Unknown deadlines stay null. A posting's deadline is unverified by default and AI/client input cannot mark it verified.

API responses: { data: T } on success; { error: { code, message } } on failure. Use 400 invalid input, 401 unauthenticated, 403 wrong role, 404 missing or inaccessible owned resource, 429 request limit, 502 AI/provider invalid response, 503 service unavailable. Do not expose private resource existence. Unknown internal errors return a generic message and a server-side request id. Never return stack traces or prompt contents.

| Endpoint | Owner | Contract |
|---|---|---|
| GET /api/profile | Steve | Own StudentProfile; initialize empty defaults safely on first sign-in |
| PUT /api/profile | Steve | Body { displayName, field, facts }; atomic save of caller-owned data; reject foreign fact ids; return StudentProfile |
| GET /api/jobs | Dallas | List caller's private imports + published employer jobs with filters/pagination |
| GET /api/jobs/[id] | Dallas | Authorized JobPosting; saved/own paused listing remains readable as inactive, hidden job content is suppressed |
| POST /api/jobs/search | Dallas | Body JobSearchQuery -> JobPosting[] already validated/persisted privately for the caller, max 5/query |
| POST /api/jobs/import | Dallas | Body JobDraft -> private JobPosting with source=pasted; source/owner/status/verification set by server |
| POST /api/resume/suggest | Dallas | Body { jobId } -> persisted ResumeVersion; check job access then load own facts; no client-supplied profile |
| GET /api/resume/[id] | Dallas | Own ResumeVersion |
| PATCH /api/resume/[id] | Dallas | Body { editedBullets }; persist own edits, return ResumeVersion |
| GET /api/applications | Steve | Caller-owned applications + authorized job summaries |
| POST /api/applications | Steve | Body { jobId }; check job access, create/upsert by unique (user_id, job_id) |
| PATCH /api/applications/[id] | Steve | Body { status?, deadline?, notes? }; own row only |
| DELETE /api/applications/[id] | Steve | Unsave own row; return { id } |
| /api/employer/jobs and /api/employer/jobs/[id] | Keyan | GET/POST/PATCH own employer listings with EmployerJobInput; use pause instead of hard delete |
| GET /api/employer/stats | Keyan | Own listing counts { jobId, uniqueViewers, currentSaves } |
| POST /api/events/view | Keyan | Body { jobId }; authenticated student, visible published employer listing; record deduplicated view |

Search results already have authorized database ids, so select -> suggest/save needs no missing import step. Only max 5 validated results are stored per query; deduplicate within the user's source/external-id or canonical URL where available. User-pasted imports remain private, including if their text resembles an employer listing. Provider adapters return validated JobDraft data plus trusted provider metadata; only server code assigns source/retrieval timestamps. Store the actual description/snippet supplied by the source, never a fabricated full posting; ask for pasted full text before detailed tailoring if the source content is insufficient. AI text alone does not prove a job is open.

Keyan provides adapters for profile read/save, authorized job read/list/import, saved applications, resume versions, and employer stats. Publish names/signatures early; do not make unrelated features wait for complete styling. Profile/fact save is transactional; use a narrowly scoped checked RPC if needed. On later fact edits/deletions, historical resume evidence comes from its stored snapshot. Concurrent profile saves should use updatedAt or equivalent conflict detection to avoid silent overwrite.

## Supabase schema, ownership, and analytics

Keyan alone authors migrations and schema/config changes, including work already in progress; Dallas reviews contract compatibility. Do not reset an existing project or re-run creation scripts blindly. Record applied migration ids, required grants and a safe migration/recovery procedure.

| Table | Required fields and rules |
|---|---|
| profiles | id references auth.users, display_name, field nullable, timestamps. Own SELECT/UPDATE; provision on sign-in/trigger; no mutable role column. |
| user_roles | user_id unique references auth.users; role student|employer|admin. Trusted default=student provisioner. User may read own role only; no client INSERT/UPDATE/DELETE/upsert grants. |
| employers | id, owner_user_id unique, company_name, timestamps. Own access for employer role; one employer per account in MVP. Company collaborators later. |
| student_facts | id, user_id, kind, text, dates, org, timestamps. Student owner CRUD; never transferable to another user. |
| jobs | Contract fields including created_by_user_id, employer_id nullable. For employer source: employer_id must belong to caller and creator must match; otherwise employer_id null, owner=caller, status private. Ownership/source immutable through feature edits. |
| saved_applications | id, user_id, job_id, status, deadline, notes, timestamps; UNIQUE(user_id, job_id). Student owner CRUD; new saves require readable job. |
| resume_versions | id, user_id, job_id, generated_payload jsonb, edited_bullets jsonb, fact_snapshot jsonb, timestamps. Student owner access; generated data/snapshots written through restricted generation path, not arbitrary client mutation. |
| job_views | job_id, viewer_user_id, created_at; UNIQUE(job_id, viewer_user_id). Deduplicated lifetime viewers for MVP; private, no employer access to raw rows. |

Enable RLS and minimal explicit grants on all exposed tables. Policies cover SELECT, INSERT WITH CHECK, UPDATE old/new ownership, DELETE; grants and policies must agree. Rows aren't column permissions: protect role/provenance/immutable fields with protected tables, restricted privileges or narrow checked functions. Test direct Data API calls as well as UI routes.

Visibility: students read their own private jobs and published employer jobs. A saved employer job later paused stays visible to that student as inactive (no longer listed as available). Hidden employer content is not returned to students; retain an application placeholder/status. Drafts are visible only to their employer. Employers never read student profiles, facts, private jobs, applications or resumes. Admin maintenance access is explicit and audited; do not create a blanket public admin view.

Saved-job analytics = current count of unique saved_applications for each employer listing. Do not accept a separate client-submitted save event or numeric counter. Repeated save does not increment; unsave decrements.

View analytics = unique authenticated student viewers since listing creation. Refresh/retry must not increment for the same user/job. A restricted record-view function derives viewer from auth.uid(), validates student role and published employer job, and uses ON CONFLICT DO NOTHING. A restricted employer-stats function validates the employer's identity/ownership and returns only counts, never viewer identifiers or application rows. No unique-person guarantee beyond authenticated accounts and no claim that a click equals an application.

If using SECURITY DEFINER functions, set a fixed safe search_path, fully qualify objects, explicitly authorize callers, revoke default PUBLIC execution and grant only required roles. Avoid default privileged views; security_invoker views need appropriate underlying policies, and must not grant raw student-data access to make counts work. Test anonymous, wrong-role and cross-employer calls. Security tests must use ordinary user sessions; privileged setup is limited to provisioning fictional accounts/roles outside the actual assertions.

Roles: students self-register; demo employer/admin roles are assigned by trusted SQL or a protected setup process, not a signup field. Employer onboarding approval/self-service is future work. Supabase dashboard access is developer administration, not the product's admin role. Auth email delivery/redirect setup must be tested before demo; use pre-provisioned fictional demo accounts if needed without weakening account permissions.

## Claude, search, optional APIs, and privacy

One config selector: JOB_SEARCH_PROVIDER=claude_web (preferred after smoke check) or none (pasted-job path). Future provider ids are optional. There is no second search-enable flag that can conflict. Claude needs an actual enabled web-search tool or a vetted remote MCP source; a text-only Messages call does not browse. Verify exact model and supported tool versions during implementation from official docs; model id lives once in CLAUDE_MODEL.

Provider interface: search(query: JobSearchQuery) -> Promise<ProviderJobDraft[]>; ProviderJobDraft contains JobDraft plus providerName, externalId|null, retrievedAt, and allowed source metadata. Validate in server code before storing. Third-party APIs may be absent with no required key, import, build dependency or UI change. Verify provider storage/display/attribution terms before connecting it. For restricted sources, choose an allowed retention strategy or do not enable the source. No required background scheduler.

Bounded defaults to implement centrally: 20,000 characters/job description, 30,000 total profile fact characters, 100 facts, max 5 results/search, max 3 searches/request, max 10 suggested bullets and bounded output tokens. Suggested starting rate limits: 5 searches and 10 resume generations/user/hour; put exact enforced budgets in config/README and allow tuning. Use a shared persistent/managed limiter for deployed multi-instance limits; in-memory counters are not a global quota. Request timeouts/retry budgets must fit the deployed Vercel runtime. Handle tool errors/continuations explicitly; one bounded retry at most. Display recoverable errors, not invented results.

Job-search requests use short career/location/skill preferences, not complete resumes or contact details. Web/MCP material is untrusted. Search tools may discover candidate URLs, but server policy controls allowed tools, HTTPS destinations and any fetches; block private-network URLs/redirects if implementing a fetcher, sanitize rendered content, never expose secrets or grant the model arbitrary SQL/shell/email capabilities. Delimit external data in prompts; instructions alone are not a security boundary.

For suggestions: load caller-owned facts and an authorized job server-side; require explicit notice/consent before sending relevant text to Anthropic; omit contact details not needed. Validate schema, fact ids, bullet count/length and unsupported numbers/dates. Normalize numeric formatting deliberately; matching a number or fact id does not verify the whole claim. Show cited snapshot text and gaps; keep generated content labeled as needing review. Student edits remain student-authored. Never auto-submit an application. Save both generated content/snapshot and edited content so reload preserves edits.

Log request ids, status, duration and token counts when available; avoid raw prompts/resumes/contact data, bearer tokens and secret values. Users can use real information with consent; tests/screenshots/public demo use fictional people. Provide own-record deletion where implemented and document remaining deletion/retention limitations honestly. No personal data in browser localStorage; theme preference is okay. Session handling follows the chosen Supabase SDK pattern.

## Design, mobile, and performance

Both light and dark themes are required. Steve owns semantic CSS tokens, a visible keyboard-accessible toggle and remembered theme preference (no personal data); use OS preference as first-visit default. Apply themes to student/employer/auth pages, inputs, focus states, alerts, loading/error/empty states. Dallas wires Steve's provider/navigation into the root shell. Check theme startup for a distracting flash; follow the actual framework pattern rather than adding suppression blindly.

Preserve the supplied logo artwork/proportions; upload path/prototype export is still TBD. Use an accessible text wordmark while assets are unavailable, not a fabricated replacement. Starting colors are provisional leather brown, orange/gold, cream and charcoal; exact tokens/fonts come from the actual supplied design, not an imagined prototype version. Use dark text on amber CTAs if needed; measure contrast (body text 4.5:1, large text/meaningful non-text controls 3:1). Keep decorative/logo contrast claims separate from text requirements.

Mobile first: test 390x844 and 1280x800, both themes, no horizontal overflow. Use labels, appropriate input types, visible focus, keyboard navigation, semantic buttons, accessible loading/error announcements and comfortable touch targets (aim 44px). Native disabled buttons are non-activatable and normally omitted from tab order; enabled buttons must be keyboard reachable.

Performance: paginate job results, fetch only needed fields, avoid duplicate requests, memoize/cache only with a clear need. Cache public data within source terms; user-private caches must be scoped by user, and personalized authenticated responses must not be shared across users. Parallelize independent requests only; preserve order for dependent writes. Measure loading duration/request count before adding concurrency. No unverified performance percentages in UI or demo.

## Test-first workflow, checks, and reporting

Before feature code, state requirement, acceptance criteria, input/output, dependencies. Write focused tests first; ensure initial failure is due to missing behavior, not broken setup. Then implement. Do not weaken live permissions to produce a failing security test: run baseline/mutation checks only in isolated test data/environments.

Use unit tests for schemas/mappers/validators, database/integration tests for RLS and persistence, Playwright for user journeys. Run Playwright after each integrated feature, phone+desktop and both themes where visual; focused tests first, integrated student/employer journeys before recording. Mock external AI/search in repeatable routine tests; mock the server provider for server integration tests (browser interception alone doesn't stop server-side calls). Run separately labeled, budgeted live Claude/search smoke checks. Mocked evidence is not proof of live integration.

Required checks as commands become available: typecheck, lint, unit tests, relevant security tests, production build and focused Playwright. Do not claim missing scripts or unrun checks passed. Authentication tests cover invalid/expired sessions. Security assertions inspect returned rows and persisted state, not just HTTP errors (RLS may return empty results).

Security regression list: two students isolated for profiles/facts/private jobs/applications/resumes; foreign jobId cannot be suggested/saved/read; facts cannot be moved between users; roles cannot be escalated via metadata or direct insert/update/upsert; two employers isolated for draft/write/stats; generated snapshot immutable; paused/hidden listing behavior; repeated views/saves and unsave counts; anonymous direct RPC denied. Secret scanning uses a real scanner (e.g. Gitleaks) and findings review, plus browser-bundle inspection. Literal strings like service_role in SQL or a documented public key are not automatically secrets. Never print secret values while scanning.

A feature is done when acceptance criteria pass, relevant tests run, Playwright verifies integrated behavior/mobile/themes, security checks pass where applicable, edits survive reload, and changes merge with build/typecheck passing. Reports: Task/owner; exact changed files; commands/results or NOT RUN + reason; browser widths/themes; security outcomes; contract requests/blockers; next task.

## Git, integration, configuration, and deployment

Inspect git status and branches before work. Separate branch/checkout per writer; worktrees are useful for multiple agents on one machine. Start a task from current main, e.g. git fetch origin then git worktree add ../cf-profile -b steve/profile origin/main (if paths/branch are unused). Clone independently on other laptops. Preserve uncommitted user work.

Small coherent PRs; bootstrap/migrations may be larger when necessary. Dallas integrates one at a time after review/checks. At task boundaries, with a clean working tree, fetch and merge origin/main into a shared feature branch; rebase only a branch you alone use. Do not force-push shared branches or rebase active agents' work. Commit/push when the human has requested publishing; do not repeatedly ask during an authorized workflow.

Main should run/deploy after scaffold; currently it is docs-only. Use immutable checkpoint tags such as demo-checkpoint-01 and a final submitted commit SHA. Never move a shared checkpoint tag. Add .gitignore before app/credential setup. Keep existing repo files; old prompts are context, not a competing schema specification.

Environment names, no real values in Git:
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or the existing project's legacy anon key name, document one convention).
- ANTHROPIC_API_KEY, CLAUDE_MODEL, JOB_SEARCH_PROVIDER, APP_URL: server-only except explicitly public config.
- SUPABASE_SECRET_KEY: optional server-only, only in tightly scoped administrative paths; ordinary request clients carry the user's session. A legacy service-role name may be retained if already used, never exposed with NEXT_PUBLIC_.
- Provider-specific API keys: optional only when enabled.
- E2E_STUDENT_A_EMAIL/PASSWORD, E2E_STUDENT_B_EMAIL/PASSWORD, E2E_EMPLOYER_A_EMAIL/PASSWORD, E2E_EMPLOYER_B_EMAIL/PASSWORD: local/test/CI only, fictional accounts.
- Persistent rate-limit backend/config names: choose during scaffold and document; do not invent deployed credentials.
Separate preview/test and real-user configuration where possible; never run destructive test resets against real data. Vercel: install env values via project settings, test auth callback/redirect allowlists and email behavior, confirm function timeout/runtime compatibility, then run deployed smoke checks. Preview URL/auth setup must not break production sign-in.

## Timebox, fallbacks, and decisions

Handout: event November 13–14, 2026; Saturday competition end appears 4pm America/Denver. Exact submission cutoff/format still needs organizer confirmation; do not manufacture a deadline. Plan from time remaining rather than missed clock targets.

| Remaining-budget checkpoint | Outcome |
|---|---|
| First 30–60 min | Scaffold/contracts/fixtures published; Keyan reports current database work; design and demo start in parallel |
| First 10–15% | Early Vercel deploy, Auth test, real Claude/search spike (max ~60–90 min investigation) |
| By halfway | Student profile -> job -> suggestion -> saved app works; employer draft/publish integrated if ready |
| By 70–75% used | Security/persistence and both themes verified; record explicit cuts |
| Final 20–25% | Freeze features, fix bugs, record/edit video, rehearse and submit with buffer (aim at least 1h) |

If search fails use pasted description; if Claude fails show saved previously generated suggestions or a labeled recording, not fake live output. If deploy fails run locally plus backup recording. Will starts script/data/recording tests now, not at freeze.

Stretch only after core works and there is a safe time budget: job API adapter, calendar export, contacts/followups, news, typed/voice interview practice, camera coaching, mentor role, custom admin UI, scheduled searching. Usage counts do not prove causal hiring improvements.

Before submit: deployed signed-out -> sign-in -> complete student journey; employer demo if included; mobile/light/dark checked; cross-account tests/build/typecheck pass; fictional video and no secrets; 60–90s video link opens; actual portal/deadline/team list confirmed; document implemented/fallback/cut features and final commit. Do not claim school endorsement, ATS scores, verified openings, or causal outcomes without evidence.

Decision register: confirmed Career Forge, four teammates, Keyan owns Supabase, employer posting/reach, Claude-first with optional APIs, Vercel, test-first/Playwright/mobile, both themes. Defaults: Next.js/TypeScript, one employer/account, seeded employer/admin roles, lifetime account-based unique views/current saves. TBD: final model/tool availability, actual logo/prototype asset paths/fonts/colors, Supabase project/migration state, configured limiter and runtime limits, exact organizer cutoff, video host/visibility, teammate availability. Owner changes require a short recorded handoff.

