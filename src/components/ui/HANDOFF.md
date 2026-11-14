# Steve visual system handoff

## Status

The current CareerForge main has a Next.js 15 App Router scaffold using React 18, shared [contracts](../../contracts/) and [fictional examples](../../data/examples.ts). This slice adds theme, navigation, Button/Input, CSS tokens, and a separate component fixture. It does not add profile or saved-application routes, auth, persistence, or résumé behavior. The preview's form and `/saved` state use fictional in-memory data only.

## Dallas integration request

Dallas owns `src/app/layout.tsx` and `src/app/page.tsx`; please wire this slice there in a separate integration change:

1. Import `src/styles/tokens.css` and `src/styles/components.css` once from the root layout, alongside existing `globals.css`. Do not import `examples/preview.css` into the product.
2. Wrap the app body in `ThemeProvider` from `src/components/theme/ThemeProvider.tsx`. Add `ThemeToggle` inside that provider. `useTheme()` returns `{ theme: 'light' | 'dark' | null, setTheme }`; null is pre-hydration. Only the `careerforge-theme` preference is kept in localStorage.
3. Apply the static `THEME_INIT_SCRIPT` from `src/components/theme/theme.ts` in the document head before first paint. The script changes the HTML theme attributes; scope `suppressHydrationWarning` to `<html>` if needed, and include a CSP nonce if the deployed policy requires one.
4. Add an app-owned skip link and `<main id="main">`, then `MainNav({ currentPath, showEmployer? })` from `src/components/nav/MainNav.tsx`. Supply `currentPath` from the actual pathname and `showEmployer` from a verified role; that flag controls presentation only. The anchors do full navigations.
5. Keep the existing landing content and shared contracts. `Button` uses native button attributes plus `variant` and `loading`; `Input` requires `label` and links optional hint/error text. The brand asset is `/brand/careerforge.webp` at its original proportions.

The temporary Next integration check tests this wiring in a separate worktree; it is not part of this PR. Dallas should include it in an integration PR after accepting the component slice. Coordinate profile/application adapter signatures and confirmed contract fields with Keyan before implementing persistence.

## Checks

From the repository root, install the committed app dependencies and run:

```powershell
npm ci
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run smoke
```

`npm run smoke` uses the root Playwright config, starts the built Next app on port 3000, and tests only the landing page at desktop/mobile widths. It does not run Steve's port-4317 preview suite.

The component fixture has a separate toolchain solely for `esbuild`; install matching committed React, React DOM, Playwright and TypeScript versions there. This does not change `package.json` or the lockfile:

```powershell
$env:STEVE_TOOLCHAIN = Join-Path $env:TEMP 'careerforge-steve-tools'
npm install --prefix $env:STEVE_TOOLCHAIN --no-save --no-audit --no-fund esbuild@0.25 react@18.3.1 react-dom@18.3.1 @types/react@18.3.3 @types/react-dom@18.3.0 @types/node@22.7.4 typescript@5.6.2 @playwright/test@1.65.1
$env:STEVE_SCREENSHOTS = Join-Path $env:TEMP 'careerforge-steve-screenshots'
node src/components/ui/examples/check.mjs
node src/components/ui/examples/typecheck.mjs
node src/components/ui/examples/preview-check.mjs
```

The last command starts and stops the preview server itself. `browser-check.mjs` creates a Playwright config in the temporary toolchain and runs `steve-design.spec.ts` against port 4317. Set `STEVE_BROWSER` to a Chromium executable if the default Windows Edge path is unavailable. Screenshots, traces and bundles stay outside Git. These fixture checks prove only component behavior, not Next integration or saved data.

Report exact pass/fail results for the current commit. Do not treat the isolated preview as proof of production routes, auth, data security or persistence.
