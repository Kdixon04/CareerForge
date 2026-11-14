# Codex — integrator handoff (~2:45 PM Denver)

## Queue (merge order)

1. Keyan PR: `src/lib/data/jobs.ts` (+ profile/resume if included) — run `npm run typecheck`, `npm test`, `npm run build`.
2. Dallas PR: `dallas/cursor-deploy-handoff-docs` (deploy checklist + student nav + Will script).
3. Antigravity: job route wiring, then résumé routes.
4. **Do not** merge DRAFT #35 without Steve.

## Enablement (human confirms smoke first)

- [`core-at-12-runbook.md`](core-at-12-runbook.md): flip `IS_JOB_PERSISTENCE_AVAILABLE` only after deployed import/read works.
- Playwright Windows fix: `webServer` use `node_modules/.bin/next start`, `reuseExistingServer: !process.env.CI` (see handoff on PR #7).

## Env

Pull names from Vercel dashboard / human — **never invent** `ANTHROPIC_*` or Supabase secrets in repo.

## Freeze 3:45

- Stop feature merges; only blocker fixes.
- Record final `main` SHA for submit ([`freeze-submit-4pm.md`](freeze-submit-4pm.md)).