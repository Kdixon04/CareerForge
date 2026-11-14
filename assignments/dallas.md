# Dallas — integration, contracts, Claude, and job flow

Read [AGENTS.md](../AGENTS.md) first. It defines the shared contracts, permissions, tests and literal paths. Use this file for task order, not a competing specification.

## Mission and boundaries

Own the runnable foundation, job discovery/import and resume generation/review flow; review and integrate small PRs. Keyan owns database/schema/RLS and adapters, including Supabase work already in progress. Steve owns profile/saved UI and their API wiring. Do not duplicate those implementations.

Owned paths: src/contracts/**, src/lib/claude/**, src/lib/jobs/**, src/app/(auth)/**, src/app/(student)/jobs/**, src/app/(student)/match/**, src/app/api/jobs/**, src/app/api/resume/**, src/app/layout.tsx, src/app/page.tsx, README.md, AGENTS.md, package/lockfile, framework/test/deployment configuration, .github/**, .env.example, .gitignore, tests/e2e/dallas-*.spec.ts, tests/unit/dallas-*.test.ts.

Request changes to Keyan's supabase/**, src/lib/supabase/**, src/lib/data/** and employer paths, Steve's UI/profile/application paths, and Will's demo/**. Delegate only a specific task/path in a separate checkout and announce the writer.

## First handoff (~30–60 minutes)

1. Inspect current main and local changes; confirm actual deadline/submission with organizers when available.
2. Ask Keyan what Supabase schema is already applied/drafted. Agree API vs database naming and fields before creating shared schemas.
3. Publish a minimal Next.js/TypeScript scaffold, .gitignore, tests/scripts and Zod contracts/fictional fixtures. Publish dependencies once so others do not change the lockfile independently.
4. Agree navigation/theme component props with Steve; coordinate auth clients/sign-in with Keyan.
5. Deploy a minimal Vercel page early and publish actual README commands. Configuration values remain private.

## Ordered deliverables

- A plain Claude call and a live search spike in the first 10–15% of time. Record exact tested model/tool and go/no-go, without secrets.
- One JOB_SEARCH_PROVIDER selector (claude_web or none); optional external APIs disabled without affecting build, auth or pasted jobs.
- GET /api/jobs, GET /api/jobs/[id], POST /api/jobs/search and POST /api/jobs/import. Search persists a bounded set of validated private results; returned ids work for suggestion/save without an extra missing import step.
- Job browse/search/paste/detail pages with career field/keywords/location/job type/work arrangement controls, source link/date and honest verification labels. Render remote text safely and accept pasted descriptions even if AI search is unavailable.
- Suggestion routes load own facts and authorized job; generate/validate and persist ResumeVersion with snapshot; GET/PATCH own version supports edited bullets.
- Match/review UI shows quoted source evidence and gaps, student review notice, copy action and explicit save-edits action/status. Editing then reloading must retain edits.
- Root shell wires Steve's navigation and both themes; sign-in uses Keyan's supported auth setup.
- Merge one feature slice early, then incrementally integrate student and employer routes. Avoid waiting for every feature to be finished before first integration.

## Acceptance and test-first checks

Write focused tests before feature behavior: bad model schema, foreign evidence id, unsupported metrics, malformed input, provider timeout/failure, unauthorized job id, and user-edited bullet persistence. Valid ids/numbers alone are not factual proof; user reviews text.

Routine tests mock provider/model output in the server layer so actual server requests do not unexpectedly spend credits. Separate budgeted real Claude/search smoke run verifies current connectivity and is reported distinctly.

Playwright tests/e2e/dallas-journey.spec.ts: sign in -> save profile -> search or paste a job -> suggestions/evidence/gaps -> edit and save bullet -> reload -> exact edit retained -> save application -> change status -> reload -> state retained. Cover empty/error/loading states and search-disabled fallback. Run at 390x844 and 1280x800, both themes; perform deployed smoke check after integration. Check theme persists across student/employer/auth navigation.

Run available typecheck/lint/build and relevant tests. Never report tests skipped for missing credentials as passed. Authentication/ownership assertions use ordinary sessions; Keyan provisions separate fictional accounts.

## Security and performance

Never put Anthropic/privileged Supabase keys in browser code or logs. Keyan's user-scoped adapters enforce access; reject foreign job/version ids before model calls. Server controls provider/owner/verification metadata. Implement configured input/output/search bounds, request timeout, one bounded retry and a persistent deployed limiter. Cache private responses only per user and don't log prompts. Avoid shared caches of personalized results.

Only search with necessary career preferences; display a clear notice/consent before sending selected experience to Claude. Provider/MCP permissions are narrowly scoped; external content cannot grant tools or reach private data. Check actual Vercel runtime limits and callback URLs.

## Handoff and close

Report task, files, exact commands/outcomes or NOT RUN, tested themes/viewports, security results, contract changes and next step. Keep README setup/environment instructions current. Update shared decisions after human direction; preserve existing schema work. Freeze new features with the final 20–25% of time reserved for tests/video/rehearsal/submission. Use immutable checkpoint tags and record the submitted SHA.

Stretch only if core is healthy: one permitted external job provider or simple calendar export; no new framework to solve a hypothetical future need.

