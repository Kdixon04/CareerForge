# Codex — 2pm merge queue (integrator)

**Role:** merge CI-green PRs into `main` one at a time; no flag flips; leave Steve **#35 DRAFT**.

## Queue order

| # | PR / branch | Merge when | Notes |
|---|---|---|---|
| 1 | [#48](https://github.com/Kdixon04/CareerForge/pull/48) `dallas/cursor-deploy-handoff-docs` | CI green | Student RootShell nav + deploy checklist + demo script + e2e selector fix. **Covers nav** (includes `dallas/cursor-student-nav-shell` @ `63f4dfe`). |
| 2 | Keyan `src/lib/data/**` (jobs + optional profile/resume) | CI green + Dallas contract review | Blocking for private import/read and résumé persistence. See [keyan-adapter-impl-prompt.md](keyan-adapter-impl-prompt.md). |
| 3 | `dallas/antigravity-inert-resume-routes` | CI green | Fail-closed `POST/GET/PATCH /api/resume/*`. Wire adapters only after Keyan lands. |
| 4 | Antigravity job-route wiring (import/`[id]` enablement) | After Keyan adapters on main | Pass `createPrivateJobImport` / `getAuthorizedJob`; still no Cursor flag flip until smoke. |
| 5 | Antigravity résumé live path | After Keyan resume adapters + `ANTHROPIC_API_KEY` in Vercel | Replace inert 503 on suggest with `resume-suggest` + persist. |

## Explicitly do **not** merge

- **[#35](https://github.com/Kdixon04/CareerForge/pull/35)** — leave **DRAFT** until Steve requests.
- Any PR that flips `IS_JOB_PERSISTENCE_AVAILABLE` or `IS_PREP_LIVE` / `JOB_SEARCH_PROVIDER=claude_web` without human smoke confirmation.
- PRs with failing `TypeScript, tests, build, smoke`.

## Commands before each merge

```powershell
gh pr checks <N>
npm run typecheck
npm test
npm run build
# smoke is covered by CI; local optional:
# npm run smoke
```

After merge: record new `main` SHA in [judges-feature-list.md](judges-feature-list.md) and [teammates.md](../teammates.md).

## Env / secrets

Pull real values from Vercel / Supabase dashboard (human). **Never invent** `ANTHROPIC_*`, Supabase keys, or E2E passwords into the repo.

## Freeze

Stop feature merges at freeze time; blocker fixes only. Final SHA + video + deploy URL go in the judges list blanks.
