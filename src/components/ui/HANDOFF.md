# Steve's first visual slice

## Status and limits

Component preview only. No authentication, student profile form, saved-application feature, database persistence or AI integration is implemented by this slice. The example form validates a fictional career field in memory and explicitly says nothing is saved/sent. The `/saved` preview is an empty-state example, not a functional application route. No prototype was supplied; colors come from the actual logo, whose copied asset is byte-identical to the original.

Dallas's scaffold, shared runtime schemas/fixtures and Keyan's auth/data adapters are absent from the inspected origin/main (`ac5de72`). Do not create a second scaffold or invent database fields to unblock this slice.

## Dallas: exact integration surface

- Import `src/styles/tokens.css` and `src/styles/components.css` once in the root layout. `examples/preview.css` is for the isolated fixture only; do not apply it globally to the product.
- `ThemeProvider({ children: ReactNode })` from `src/components/theme/ThemeProvider.tsx`: wrap the app shell once. `useTheme()` returns `{ theme: 'light' | 'dark' | null, setTheme(theme): void }`; null is the pre-hydration state.
- `ThemeToggle()` from `src/components/theme/ThemeToggle.tsx`: place inside that provider. Its stable accessible name is “Dark theme”, and `aria-pressed` conveys whether dark mode is enabled. No personal information is stored; the only localStorage key is `careerforge-theme`.
- `THEME_INIT_SCRIPT` from `src/components/theme/theme.ts`: static trusted startup code to apply stored/system preference before first paint. Integrate using the actual framework/CSP approach. For a synchronous inline head script, supply the CSP nonce if required and use a targeted `suppressHydrationWarning` on `<html>` because this script intentionally changes only its theme attributes before hydration. Do not suppress warnings throughout the tree. The isolated SSR/hydration fixture has no console/hydration errors; actual Next.js integration still needs testing.
- `MainNav({ currentPath: string, showEmployer?: boolean })` from `src/components/nav/MainNav.tsx`. Supply verified-role-based `showEmployer`; this flag is presentation only, not authorization. Links are ordinary anchors for now, so full navigations work without a Next.js dependency. Route prefix matching marks nested jobs pages current. Pair with an app-owned skip link/main landmark.
- `Button` from `src/components/ui/Button.tsx`: native button attributes plus `variant?: 'primary' | 'secondary'`, `loading?: boolean`. Defaults to `type="button"` to avoid accidental submission; loading natively disables it. Caller supplies visible loading text such as “Saving…”.
- `Input` from `src/components/ui/Input.tsx`: native input attributes plus required `label: string`, optional `hint: ReactNode`, `error: string`. Caller can supply `id`; otherwise React `useId` links label/hint/error. Existing `aria-describedby` ids are retained. Native controlled values/events work normally.
- Brand asset: `/brand/careerforge.webp`, original proportions; render with descriptive alt or empty alt when adjacent text already supplies its meaning. The fixture caption/disclaimer is not required product copy.

Do not add a theme package; these components use React and CSS only. Input label linkage follows the [React input guidance](https://react.dev/reference/react-dom/components/input). Coordinate startup script placement with the [Next.js Script reference](https://nextjs.org/docs/app/api-reference/components/script) and your actual scaffold/CSP rather than assuming the fixture is a Next.js build.

## Keyan / Dallas: next dependencies

Please publish the actual module paths and signatures for verified user-scoped server/browser clients, profile read + atomic save with stale-update conflict feedback, and application list/save/update/unsave with authorized job summaries. Confirm how hidden/paused summaries are represented. Names/signatures are requests, not independently invented interfaces.

Dallas must publish the shared `StudentProfile`, editable profile input, `StudentFact`, application update schemas, API error conventions and fictional fixtures first. The reference's optimistic-concurrency requirement needs an agreed request field/header; Steve will not silently add a database field. Then profile UI can be built against those fixtures before real persistence checks.

## Run this independent fixture

Run from the repository root. It uses an isolated temporary toolchain; no root manifest, lockfile, app layout or team dependency was changed. Installed versions are recorded in that toolchain's package-lock.json. Normal team scripts should replace this fallback once Dallas's scaffold lands.

```powershell
$env:STEVE_TOOLCHAIN = Join-Path $env:TEMP 'careerforge-steve-tools'
# Toolchain prerequisites: Node.js, React/ReactDOM 19, their type packages,
# TypeScript 5, esbuild 0.25, @types/node 24 and @playwright/test 1.
# Install into STEVE_TOOLCHAIN only, using an available npm installation:
npm install --prefix $env:STEVE_TOOLCHAIN --no-audit --no-fund react@19 react-dom@19 @types/react@19 @types/react-dom@19 @types/node@24 typescript@5 esbuild@0.25 @playwright/test@1
node src/components/ui/examples/serve-preview.mjs
# In another terminal with the same STEVE_TOOLCHAIN:
node src/components/ui/examples/check.mjs
node src/components/ui/examples/typecheck.mjs
$env:STEVE_SCREENSHOTS = Join-Path $env:TEMP 'careerforge-steve-screenshots'
# Defaults to installed Windows Edge. Set STEVE_BROWSER to another Chromium executable if needed.
node src/components/ui/examples/browser-check.mjs
```

The local machine has no npm command. For this run, npm 11.6.2 was obtained from its official registry into the temporary toolchain; `node <toolchain>/package/bin/npm-cli.js` substitutes for `npm` above. All generated bundles, runner configuration, screenshots and traces live outside Git. The preview server listens on loopback port 4317 and serves only an explicit asset/route allowlist.

## Verified results

- Initial red run: all three theme/contrast tests failed for missing behavior; implemented theme selection/startup/tokens afterward.
- `check.mjs`: 6/6 pass (theme resolution, startup with blocked/invalid storage, both-theme contrast, native button semantics, label/error linkage and safe text rendering, role-aware navigation presentation).
- `typecheck.mjs`: strict TypeScript across 10 component/test files; zero diagnostics.
- `browser-check.mjs`: 6/6 pass, installed Edge via Playwright. Four journeys cover 390×844 and 1280×800 in light/dark; remaining cases cover blocked storage/system changes and the server-rendered first paint before React loads.
- Browser journeys cover keyboard skip link/toggle/visible focus, theme persistence through reload/navigation, empty and whitespace input, error focus/announcement, repeated valid submission, disabled native button, active navigation, saved empty state, no horizontal overflow, logo decoding and zero browser console/page errors.
- Manual in-app browser: empty submit focuses field with error, fictional text + Enter produces explicit unsaved feedback, theme switches and survives reload/navigation. Reviewed all four screenshots; corrected screenshot capture to await logo decoding.
- Contrast assertions measure text/muted/error on background/surface ≥4.5:1; action text ≥4.5:1; border/focus on background/surface ≥3:1. Disabled/decorative elements are not claimed to meet active-control contrast.
- Secretlint with its recommended rules: no findings in source/tests, Steve's assignment, shared instruction/reference documents or the generated browser JavaScript bundle. No credentials were configured for this fixture.
- NOT RUN: actual Next.js production build/lint, full student journey, database/RLS tests, real profile/application persistence, Claude/search and deployed smoke checks: the scaffold/services are not present in this checkout.

## Changed paths

`public/brand/careerforge.webp`; `src/styles/{tokens,components}.css`; `src/components/theme/{theme.ts,ThemeProvider.tsx,ThemeToggle.tsx}`; `src/components/nav/MainNav.tsx`; `src/components/ui/{Button.tsx,Input.tsx,HANDOFF.md}`; `src/components/ui/examples/{DesignPreview.tsx,preview-client.tsx,preview.css,serve-preview.mjs,check.mjs,typecheck.mjs,browser-check.mjs}`; `tests/unit/steve-design.test.ts`; `tests/e2e/steve-design.spec.ts`.

Learning takeaway: semantic tokens describe a color's job, so the same components work in both themes. Native buttons and correctly linked labels preserve browser keyboard behavior instead of recreating it. This slice proves the visual components, not the end-to-end CareerForge product.
