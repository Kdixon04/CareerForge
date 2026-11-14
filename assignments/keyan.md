# Keyan — Supabase, employer features, and security

Read [AGENTS.md](../AGENTS.md) and the current [team handoff](../teammates.md) before editing. You own Supabase work already underway; Dallas reviews shared contracts, not each SQL keystroke. Publish schema/adapters early so the team can work concurrently. Report cross-person dependencies with exact fields, signatures, and affected owner to Dallas in your handoff; do not change another owner's files.

Known skills: Python, JavaScript, HTML/CSS, Linux CLI, PowerShell, MySQL; cybersecurity focus. Next.js/TypeScript/PostgreSQL/RLS experience and availability remain unconfirmed. Ask for a short pairing session on unfamiliar setup; use focused agent assistance and report what you verified.

## Ownership and first task

Owned: supabase/**, src/lib/supabase/**, src/lib/data/**, src/app/employer/**, src/app/api/employer/**, src/app/api/events/**, tests/security/**, tests/e2e/keyan-*.spec.ts, tests/unit/keyan-*.test.ts. Custom admin paths are yours only if stretch is approved.

Do not edit Dallas's shared schemas/config/package/lockfiles, Steve's UI/profile/application routes or Will's demo files. Request shared changes with the exact field/signature needed.

First: inspect existing Supabase project/migrations/branch and report what exists, what is applied and what is only proposed. Do not expose credentials or reset existing work. Agree schema v1 with Dallas, then publish an initial migration/client/adapter slice. If another agent assists SQL, give it a nonoverlapping task and exclusive file ownership.

## Ordered implementation

1. Supply supported browser/server auth clients and document safe setup/role promotion. Dallas wires sign-in. Test hosted Auth delivery and redirect requirements early.
2. Implement migrations for profiles, protected user_roles, employers, student_facts, jobs, saved_applications, resume_versions and job_views according to master contracts. Include grants/constraints/indexes as well as RLS. Profiles store display_name/field; roles are protected separately.
3. Publish data adapter signatures for profile read/atomic save, authorized jobs/import, applications, resume versions, employer CRUD/stats. Client use is user-scoped; generation/snapshot writes are through a restricted server path, not arbitrary browser mutation. Tell Dallas/Steve when each adapter works.
4. Start employer form/list UI against typed fixtures immediately; no T-minus gate. Use EmployerJobInput, not a complete persisted job schema, to validate form fields.
5. Connect draft -> publish -> pause for employer-owned jobs. Keep the explicit /employer/jobs URL prefix, never a conflicting /(employer)/jobs route.
6. Implement record-view and aggregate-stats access as described below. Coordinate Steve's application save/unsave flow; do not create a second save counter.
7. Run isolation/security regression checks as features land. Help fix own SQL/adapter issues immediately.
8. Deploy smoke checks, setup/recovery notes and final security findings. Admin UI is optional after core; trusted role assignment works without it.

## Analytics and access acceptance

- Student A cannot access Student B's profile, facts, private jobs, applications or resume versions by UI, direct API/Data API or RPC.
- Student cannot suggest/save an inaccessible foreign job id or reassign a fact/owned record to someone else.
- Role insert/update/upsert and editable auth metadata cannot grant employer/admin. Employer/admin accounts are trusted seeded/promoted for MVP.
- Employers create/update only their own rows and cannot spoof source, ownership or verification metadata. Employer A cannot read Employer B's drafts or stats, or any private student data.
- A student can browse published employer jobs. Paused saved listing is inactive but retained for that student's tracking; hidden content is suppressed with an application placeholder.
- currentSaves is the number of current saved_applications for a listing, unique per student/job. Retry-save stays one; unsave removes one.
- uniqueViewers counts lifetime distinct student accounts that viewed a published listing. RPC derives viewer from auth.uid(), validates listing/role, uses unique(job_id, viewer_user_id). Refresh stays one. Label it accurately; don't imply proof of applications or hiring.
- Stats return counts only. Employers never gain raw viewer/application read access for analytics. SECURITY DEFINER functions, if used, have fixed search_path, explicit authorization and restricted execution; views must not bypass tenant isolation.
- Profile save is atomic, rejects foreign fact ids and detects stale conflicting saves. Historical resume evidence remains intact through snapshots when profile facts change.

## Test first, then implement

Write meaningful SQL/integration tests before policies/adapters, using fictional students A/B, employers A/B and an ordinary session. Privileged clients may provision fixtures only; actual assertions use those users' sessions. Check data remains unchanged after denied writes; RLS SELECT can return an empty result rather than HTTP 403. Do not disable policies on real data to make a test fail.

Playwright tests/e2e/keyan-employer.spec.ts: sign in employer -> create draft -> invisible to student -> publish -> student views/saves -> employer sees 1/1 -> refresh/retry-save stays 1/1 -> unsave becomes 1/0 -> pause makes listing inactive. Employer B cannot access listing edit/stats. Test phone/desktop and both themes after integration.

Report actual security/unit/build commands and outcomes. Use a real secret scanner/findings review and browser-bundle inspection; don't treat the word service_role in SQL as a leaked credential.

## Safe operations and handoff

Keep migration history versioned, preserve existing project state, explain recovery. Use isolated test/preview data for resets; do not apply destructive SQL to real users. Never put secret keys, connection strings or real profiles in SQL, Git, reports or screenshots. No personal prompts/data sent to coding tools while debugging.

For each handoff: tables/adapters ready, contract differences, changed files, exact checks/results or NOT RUN, security findings (resource/operation/test/status), blockers, and next slice. Ask Dallas for one coordinated dependency install if needed. Pair with Steve/Dallas on adapter signatures rather than doing their UI wiring yourself.

Stretch: restricted admin listing-hide UI, short security-design notes for judges, employer onboarding workflow. Do not build candidate browsing or expose student identities.

