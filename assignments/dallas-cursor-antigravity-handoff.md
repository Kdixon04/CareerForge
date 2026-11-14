# Cursor ↔ Antigravity API handoff (slice 3 reconciliation)

Agreed **wire shapes** from [AGENTS.md](../AGENTS.md) contracts v1. Cursor will call these from student UI once routes and Keyan adapters are live. Until then, UI stays on fixtures and `submitPasteJob`’s pre-import fallback.

## Already on `main` (Antigravity)

| Route | Request | Success response | Cursor consumer |
|-------|---------|------------------|-----------------|
| `POST /api/jobs/parse` | JSON body: `JobDraft` fields (`title`, `company`, `description`, `location`, `jobType`, `workMode`, `sourceUrl`, `deadline`) | `{ data: JobPosting }` | `PasteJobForm` via `submitPasteJob` |
| Error | — | `{ error: { code, message } }` with `400` for invalid input | field/server messages in paste form |

**Cursor ask (Antigravity):** set `IS_PARSE_ROUTE_MERGED = true` in `src/lib/jobs/submit-paste.ts` when parse is stable in prod so the browser uses the real route (Cursor does not edit that file).

## Next routes (Antigravity + Keyan)

| Route | Request | Success response | Cursor UI target |
|-------|---------|------------------|------------------|
| `POST /api/jobs/import` | `JobDraft` (after successful parse) | `{ data: JobPosting }` persisted `private` / `source: pasted` | Replace fixture id in paste preview; link `/jobs/[id]` to authorized read |
| `GET /api/jobs/[id]` | — | `{ data: JobPosting }` or `404` | Replace `findFixtureJob` on job detail |
| `POST /api/resume/suggest` | `{ jobId: string }` | `{ data: ResumeVersion }` | Job detail → generate suggestions → `/match/[resumeVersionId]` or match by job per Dallas choice |
| `GET /api/resume/[id]` | — | `{ data: ResumeVersion }` | Match review load |
| `PATCH /api/resume/[id]` | `{ editedBullets: [{ id, text }] }` | `{ data: ResumeVersion }` | Match review save (reload must retain edits) |

**Match review URL today:** `/match/[jobId]` with fixture `findFixtureMatch`. **After wire-up:** prefer `/match/[resumeVersionId]` or keep job-scoped suggest-on-enter; confirm with Dallas before changing the path contract.

## Validation / honesty (both sides)

- No client-supplied `userId`, `source`, `status`, or `deadlineVerified`.
- Parsed paste preview and detail stay labeled **unverified**; no “verified open” or ATS/match % UI.
- Cursor sends only `jobId` to suggest; server loads profile facts.

## PR merge order (#16 / #20)

1. Merge **PR #16** (`dallas/cursor-slice-2`) — job detail only (rebased on `fd9516d`).
2. Rebase **PR #20** with `git rebase --onto origin/main <job-detail-commit> dallas/cursor-slice-3` to drop duplicate job-detail commit; **#16 is redundant** if **#20** merges first without rebasing (single stack).
3. Do **not** merge both without dropping the duplicate `feat(jobs): fixture-backed job detail` commit.

Requested by: Cursor, 2026-11-14