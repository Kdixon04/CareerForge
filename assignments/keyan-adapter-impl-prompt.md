# Keyan — adapter implementation prompt (`src/lib/data` missing on main)

**Status:** `src/lib/data/**` is **not** on `main`. Dallas/Antigravity routes are fail-closed (503) until these land. Do **not** invent credentials in Git.

**Owner paths:** `src/lib/data/**`, `src/lib/supabase/**`, `supabase/**`, `tests/security/**`.

## Exact `JobDataAdapter` signatures

Copy these into `src/lib/data/jobs.ts` (names/types must match what Dallas handlers inject):

```ts
import type { JobDraft, JobPosting } from '../../contracts';

/**
 * User-scoped DB adapters. Callers authenticate via Supabase session;
 * never accept browser-supplied userId/role/ownership/source/verification.
 */
export interface JobDataAdapter {
  createPrivateJobImport(draft: JobDraft): Promise<JobPosting>;
  getAuthorizedJob(id: string): Promise<JobPosting | null>;
}

export declare function createPrivateJobImport(draft: JobDraft): Promise<JobPosting>;
export declare function getAuthorizedJob(id: string): Promise<JobPosting | null>;
```

### Behavior contract

| Function | Rules |
|---|---|
| `createPrivateJobImport` | Persist under RLS. Server assigns `source: 'pasted'`, `status: 'private'`, `createdByUserId` = `auth.uid()`, `employerId: null`, `deadlineVerified: false`. Return camelCase `JobPosting`. |
| `getAuthorizedJob` | Return `JobPosting` if readable under RLS (own private paste, published employer, or saved-then-paused inactive). Return `null` for missing **or** foreign private (indistinguishable). |

## Résumé adapters (needed for `/api/resume/*`)

Publish in `src/lib/data/resume.ts` (or adjacent module) with these signatures:

```ts
import type { JobPosting, ResumeVersion, StudentFact } from '../../contracts';

export interface ResumeDataAdapter {
  getAuthorizedJob(id: string): Promise<JobPosting | null>;
  getStudentFacts(userId: string): Promise<StudentFact[]>;
  createResumeVersion(input: {
    jobId: string;
    generatedPayload: {
      generatedBullets: ResumeVersion['generatedBullets'];
      match: ResumeVersion['match'];
    };
    editedBullets: ResumeVersion['editedBullets'];
    factSnapshot: StudentFact[];
  }): Promise<ResumeVersion>;
  getOwnResumeVersion(id: string): Promise<ResumeVersion | null>;
  updateOwnResumeEditedBullets(
    id: string,
    editedBullets: ResumeVersion['editedBullets'],
  ): Promise<ResumeVersion | null>;
}
```

- `createResumeVersion`: restricted generation path only (no browser INSERT grant on `resume_versions`). Generated payload + fact snapshot immutable after insert.
- `getOwnResumeVersion` / `updateOwnResumeEditedBullets`: own rows only; foreign id → `null` (route maps to 404).
- `getStudentFacts`: caller-owned facts only (suggest must not accept client-supplied profile).

## Profile (Steve waiting)

If not already shipped: `getOwnProfile()` and atomic `saveOwnProfile(displayName, field, facts)` with `updatedAt` conflict detection.

## Enablement after merge

1. Antigravity uncomments adapter imports in:
   - `src/app/api/jobs/import/route.ts`
   - `src/app/api/jobs/[id]/route.ts`
   - `src/app/api/resume/suggest/route.ts`
   - `src/app/api/resume/[id]/route.ts`
2. Cursor flips `IS_JOB_PERSISTENCE_AVAILABLE` **only** after deployed smoke — no flag flips in this prompt PR.
3. Signal Dallas when the PR is green.

## Do not

- Expose service role via `NEXT_PUBLIC_*`
- Reset the live Supabase project blindly
- Post E2E passwords in PR comments
