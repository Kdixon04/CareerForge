# Career Forge foundation

Minimal Next.js App Router foundation for the four-person BYU-Idaho hackathon project. This milestone intentionally contains only the landing page, shared contracts, fictional example data, and checks. It does not contain Supabase, job search, résumé generation, employer, profile, or saved-application features.

## Setup

Requirements: Node.js 20 and npm 10+.

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open http://localhost:3000.

## Checks

```powershell
npm run typecheck
npm test
npm run build
npx playwright install chromium   # one-time, if Chromium is not installed
npm run smoke
```

`npm test` validates the Zod contracts. Run `npm run build` before `npm run smoke`; Playwright starts the built app and checks desktop and mobile Chromium viewports. There is no lint script yet, so CI does not claim a lint result.

## Shared contracts

Read `src/contracts/index.ts` first, then the focused files:

- `student.ts`: profile and source facts.
- `job.ts`: pasted job input and persisted posting, including source URL and deadline verification.
- `resume.ts`: match evidence and saved generated/edited bullets with a fact snapshot.

`src/data/examples.ts` contains fictional data only. Contracts follow `AGENTS.md` but remain provisional until Keyan confirms database IDs, fact storage, job verification lifecycle, and résumé persistence/source-fact links.

The foundation page lives in `src/app/`, matching the paths in `AGENTS.md`. Coordinate changes to `src/app/globals.css` with Steve, who owns the design system and theme.

Dependency review: Next.js 15.5.29 pins PostCSS 8.4.31, so the lockfile overrides PostCSS to 8.5.33. Zod 3.23.8 still has a high advisory for oversized constrained collections; its schemas are currently exercised only in tests and are not parsing external requests in this foundation. Upgrade and revalidate the contracts before using Zod on untrusted API input. The production audit is not clean.

## Pull requests and deployment

Open a feature branch from current `main` and a PR into `main`. CI installs from the committed lockfile, checks TypeScript, unit contracts, production build, and a Chromium landing-page smoke at desktop and mobile widths. The smoke test needs a local Chromium installation; CI installs it with required system packages. There is no database check yet. After Keyan publishes migrations and isolated fictional test fixtures, add a separate local Supabase test job that never targets production. Vercel Git integration, if configured, handles preview and production deployments independently of this CI workflow.

## Branch handoff

The original foundation commit was `2b2dead` in a different repository. It was cherry-picked into this CareerForge branch and its provisional contracts were aligned with `AGENTS.md`. Start new feature branches from updated CareerForge `main` after this PR merges. Read `src/contracts/index.ts` and `src/data/examples.ts` first. Do not add credentials or real student data.
