# Keyan — 4pm sprint (blocking path)

**Single source:** [`keyan-ask.md`](keyan-ask.md)

## Order

1. Migrations `20261113200000` + `20261114091500` on demo project.
2. **`src/lib/data/jobs.ts`**: `createPrivateJobImport`, `getAuthorizedJob` (RLS via server client).
3. Profile adapter if profile save still blocked (Steve routes waiting).
4. Résumé persistence **only if** >30 min before freeze.
5. Seed **≥1 published employer job** (fictional company) — see SQL outline in [`vercel-supabase-deploy-checklist.md`](vercel-supabase-deploy-checklist.md).

## Auth for Vercel

Add redirect URLs: `APP_URL`, `https://*.vercel.app/**` for preview.

## Do not

- Expose service role in `NEXT_PUBLIC_*`
- Post E2E passwords in PR comments

**Signal Dallas when PR is open** — Antigravity wires routes same hour.