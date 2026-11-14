# Career Forge foundation

Minimal Next.js App Router foundation for the four-person BYU-Idaho hackathon project. This milestone intentionally contains only the landing page, shared contracts, fictional example data, and checks. It does not contain Supabase, job search, résumé generation, employer, profile, or saved-application features.

## Setup

Requirements: Node.js 20+ and npm 10+.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Checks

```powershell
npm test
npm run build
npx playwright install chromium   # one-time, if Chromium is not installed
npm run smoke
```

`npm test` validates the Zod contracts. `npm run smoke` starts the app and runs one landing-page check against desktop and mobile Playwright projects. `npm run build` is the production build check.

## Shared contracts

Read `src/contracts/index.ts` first, then the focused files:

- `student.ts`: profile identity, skills, and optional source facts.
- `job.ts`: job identity, `sourceUrl`, and `verificationStatus` (`verified`, `unverified`, or `expired`).
- `resume.ts`: suggestion text and one or more `sourceFactIds` proving where it came from.

`src/data/examples.ts` contains fictional data only. All contracts are provisional because no Keyan schema or contract was present in this checkout. Keyan needs to confirm the canonical IDs, whether facts are a separate table or JSON relation, the job verification vocabulary/lifecycle, and how résumé suggestions should persist their source-fact links. Once confirmed, update the schemas without changing the UI's example data shape unless necessary.

## Branch handoff

This work belongs on `dallas/foundation`. Cursor and Antigravity should read `src/contracts/index.ts` and `src/data/examples.ts` before building their assigned features. Do not add credentials or real student data.
