# Antigravity — 4pm sprint (server routes)

**Deadline:** 4:00 PM Denver · **After:** Keyan `src/lib/data/jobs.ts` on `main`

## Now (blocked until Keyan merges)

1. Wire [`src/app/api/jobs/import/route.ts`](../src/app/api/jobs/import/route.ts) + [`[id]/route.ts`](../src/app/api/jobs/[id]/route.ts) per comments — pass `createPrivateJobImport` / `getAuthorizedJob`.

## Next (if résumé adapter lands)

2. Ship **`POST /api/resume/suggest`**, **`GET/PATCH /api/resume/[id]`** using [`resume-suggest.ts`](../src/lib/claude/resume-suggest.ts) + Keyan persistence. Fail closed without `ANTHROPIC_API_KEY` or adapter.
3. Leave **`IS_PREP_LIVE` false**; prep HTTP already on main (#47) stays 503 without adapters.

## Out of scope today

- `JOB_SEARCH_PROVIDER=claude_web` (set `none`)
- Employer routes
- Contacts API under `/api/prep/*`

**PR:** CI green, one reviewer (Codex/Dallas). No env values in Git.