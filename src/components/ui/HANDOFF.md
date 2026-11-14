# Steve design and profile handoff

## State and boundaries

CareerForge main has the Next.js 15/React 18 scaffold, provisional [contracts](../../contracts/) and [fictional examples](../../data/examples.ts). This branch adds light/dark theme components, navigation, Button/Input/Textarea and a real `/profile` route backed by fictional data. Its form supports editable facts and validation; **Save profile is disabled** until Keyan supplies a verified, user-scoped adapter. Reload discards edits. There is no real auth, database persistence or live AI flow here. This branch adds an explicitly fictional, in-memory `/saved` tracking preview; see the [saved UI handoff](../../app/(student)/saved/HANDOFF.md) for current tests and backend blockers. The port-4317 component harness is a separate fixture; its `/saved` page is only an empty-state example.

Current main's `AGENTS.md` is the shared rule source. This branch removes the displaced `AGENTS.reference.md` and keeps Steve's assigned component/profile work.

## Profile and data handoff

`ProfileForm({ initialProfile: StudentProfile, onSave?: (draft: ProfileDraft, expectedUpdatedAt: string) => Promise<StudentProfile> })` is in `src/app/(student)/profile/ProfileForm.tsx`. `ProfileDraft` selects editable fields from the shared StudentProfile; it is a local UI boundary, not an agreed API schema. Without `onSave`, the form offers Check profile and leaves Save disabled. With `onSave`, it handles pending, success, error and conflict states and passes the returned `updatedAt` to the next save. The simulated callback tests do not establish server authorization or persistence.

Keyan and Dallas: confirm the verified own-profile adapter paths/signatures, atomic save and concurrency request field/header, fact ownership checks, application list/save/update/unsave adapters and hidden/paused job summaries. Replace `ProfilePreview`'s fictional loader and local ThemeProvider only when real auth/data and the root shell exist. Do not silently use the fictional profile for a signed-in student. Frontend bounds (name 120, field 160, organization 200, dates 100, 100 facts / 30,000 fact characters) need corresponding server confirmation. Zod 3.23.8 remains under advisory; Dallas must upgrade/revalidate before parsing external API requests.

## Dallas root shell integration

Dallas owns `src/app/layout.tsx` and `src/app/page.tsx`; Steve owns `src/app/globals.css`. A temporary main-based Next worktree verified the following wiring with committed React/Next dependencies; it is **not** part of this PR:

1. `globals.css` now imports `src/styles/tokens.css` and maps the actual body, foundation aliases, card, borders and CTA to the shared palette; the landing follows system light/dark preference without JavaScript. Import `src/styles/components.css` once in root layout for the shared components. Never import `examples/preview.css` into the product.
2. Wrap the shell once in `ThemeProvider` from `src/components/theme/ThemeProvider.tsx`. Put `ThemeToggle` inside it. Only the `careerforge-theme` preference is stored locally; `aria-pressed` conveys the current theme.
3. Put static `THEME_INIT_SCRIPT` from `src/components/theme/theme.ts` in the document head before first paint. Supply a CSP nonce if needed; scope `suppressHydrationWarning` to `<html>` only if the intentional theme attribute change requires it.
4. Add a skip link to the landing page's existing `<main>` after giving it `id="main"`; avoid nested landmarks. Replace the landing page's existing nav with `MainNav` in a small client shell using `usePathname()` for `currentPath`. Supply `showEmployer` from a verified role; it is presentation only. Its links are plain anchors and pages need real routes before release.
5. Keep existing landing content and shared contracts. `Button` defaults to `type="button"`; `Input` and `Textarea` link labels/hints/errors. The copied brand image lives at `/brand/careerforge.webp` and preserves original proportions.

When switching to that root shell, Steve should remove the local provider, duplicate header/toggle and profile-only skip link in `ProfilePreview`, use the root skip target `id="main"`, and update the profile browser test's skip-link expectation. The temporary integration worktree exercised that shape; those edits are deliberately absent from PR #4.

## Commands and scope of evidence

Use the committed app dependencies for the real Next checks:

```powershell
npm ci
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run smoke
```

Normal smoke starts Next on port 3000. It collects the landing and integrated `/profile` checks; it does not attempt the port-4317 fixture. The design preview spec and Node design tests live under `src/components/ui/examples/`, outside normal Playwright discovery. Profile callback cases in `tests/e2e/steve-profile.spec.ts` skip during normal smoke and run only in the separate preview command.

The component fixture needs esbuild in a disposable toolchain. Install the same React/React DOM/Playwright/TypeScript versions as the app; no manifest or lockfile change is needed:

```powershell
$env:STEVE_TOOLCHAIN = Join-Path $env:TEMP 'careerforge-steve-tools'
npm install --prefix $env:STEVE_TOOLCHAIN --no-save --no-audit --no-fund esbuild@0.25 react@18.3.1 react-dom@18.3.1 @types/react@18.3.3 @types/react-dom@18.3.0 @types/node@22.7.4 typescript@5.6.2 @playwright/test@1.65.1
$env:STEVE_SCREENSHOTS = Join-Path $env:TEMP 'careerforge-steve-screenshots'
node src/components/ui/examples/check.mjs
node src/components/ui/examples/check.mjs tests/unit/steve-profile.test.ts
node src/components/ui/examples/typecheck.mjs
node src/components/ui/examples/preview-check.mjs
node src/components/ui/examples/preview-check.mjs --profile
```

`preview-check.mjs` starts/stops the port-4317 fixture itself; `--profile` also starts/stops the built Next app on port 3000 for the integrated profile and simulated callback cases. `browser-check.mjs` writes its own Playwright config to the temporary toolchain. Set `STEVE_BROWSER` to a Chromium executable if Edge is unavailable. Bundles, screenshots and traces stay outside Git. Fixture checks prove component behavior, not database saves. Report each current command/result separately; no auth, RLS, persistence, live AI or deployment check is claimed.

## Landing palette milestone

Branch `feature/steve-shell-colors`, based on reviewed main `f6702ca`. Changed paths: `src/app/globals.css`, `tests/e2e/steve-shell.spec.ts`, this handoff and `assignments/steve-rogers.md`. No root layout, page markup, dependencies, contracts or database changes.

The landing's separate green/light colors are bridged to the existing brown/gold/cream/charcoal tokens. Card surfaces/shadow/borders and the gold action use theme-aware colors; brand/action links have visible keyboard focus. The layout and product copy are preserved.

Tests were written/run before CSS changes: 5/5 failed on the old body palette. After implementation: production build/type validation pass; contract tests 7/7, design Node tests 6/6 and profile Node tests 5/5 pass. Focused landing Playwright: 5/5 pass (390×844 and 1280×800, both schemes, rendered text contrast ≥4.5:1, keyboard action/focus, no overflow, dynamic system preference, and dark mode with JavaScript disabled). Full discovered smoke with temporary installed-Edge/reused-server override: 20 pass, 6 simulated callback cases intentionally skipped. Secretlint source/test/browser chunks: no findings. Manual browser action and all four screenshots inspected; screenshots use CSS pixels for consistent output on high-DPI test devices.

Still blocked: real profile save/reload and isolation need Keyan's verified auth/data adapters. The landing has no toggle or stored-preference startup script until Dallas performs steps 2–4 above; this CSS milestone proves system preference, not manual preference across all routes. No standalone lint script or real persistence/security/deployed journey was run.
