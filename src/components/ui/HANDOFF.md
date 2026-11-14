# Steve design and profile handoff

## State and boundaries

CareerForge main has the Next.js 15/React 18 scaffold, provisional [contracts](../../contracts/), [fictional examples](../../data/examples.ts), shared themes/navigation, an unsaved job-paste preview and a fictional `/profile` editor. PR #17 only removes the profile's redundant ThemeProvider and updates Steve's handoff/assignment. **Save profile is disabled** until a verified, user-scoped adapter exists; reload discards profile edits. There is no real auth, saved-application route, persistence or AI flow here. The separate port-4317 harness's `/saved` page is only an empty-state example.

The standards are [AGENTS.md](../../../AGENTS.md), [Steve's assignment](../../../assignments/steve-rogers.md) and the current team handoff. There is no separate agent.md or Steve.md. All PR #17 edits stay in Steve-owned profile/UI paths or his own assignment; no shared layout/config/contracts or database files were independently changed.

## Profile and data handoff

`ProfileForm({ initialProfile: StudentProfile, onSave?: (draft: ProfileDraft, expectedUpdatedAt: string) => Promise<StudentProfile> })` is in `src/app/(student)/profile/ProfileForm.tsx`. `ProfileDraft` selects editable fields from the shared StudentProfile; it is a local UI boundary, not an agreed API schema. Without `onSave`, the form offers Check profile and leaves Save disabled. With `onSave`, it handles pending, success, error and conflict states and passes the returned `updatedAt` to the next save. The simulated callback tests do not establish server authorization or persistence.

Keyan's migration and security handoff landed on main at ea26e26 (database commit 1e8c016). His handoff reports applied schema/RLS and fictional-session checks; Steve has not independently rerun them. It lists getOwnProfile/saveOwnProfile as operations to implement: there are still no src/lib/supabase or src/lib/data implementations. Keyan/Dallas must publish verified user-scoped clients and adapters, an atomic profile save with agreed concurrency request field/header, fact ownership checks, application operations and hidden/paused summaries before Steve wires real routes. Keyan's note saying the app scaffold is absent is stale; its schema/security evidence is separate from app readiness.

Replace the fictional loader only when real auth/data exist; never silently show fixture data as a signed-in student's profile. Frontend bounds (name 120, field 160, organization 200, dates 100, 100 facts / 30,000 fact characters) need server confirmation. Zod 3.23.8 remains under advisory; Dallas owns its upgrade/revalidation before external API parsing.

## Dallas root shell integration

Dallas owns `src/app/layout.tsx`, `src/app/root-shell.tsx` and `src/app/page.tsx`; Steve owns `src/app/globals.css`. The following wiring is already established on main and must be preserved:

1. `globals.css` now imports `src/styles/tokens.css` and maps the actual body, foundation aliases, card, borders and CTA to the shared palette; the landing follows system light/dark preference without JavaScript. Import `src/styles/components.css` once in root layout for the shared components. Never import `examples/preview.css` into the product.
2. Wrap the shell once in `ThemeProvider` from `src/components/theme/ThemeProvider.tsx`. Put `ThemeToggle` inside it. Only the `careerforge-theme` preference is stored locally; `aria-pressed` conveys the current theme.
3. Put static `THEME_INIT_SCRIPT` from `src/components/theme/theme.ts` in the document head before first paint. Supply a CSP nonce if needed; scope `suppressHydrationWarning` to `<html>` only if the intentional theme attribute change requires it.
4. Add a skip link to the landing page's existing `<main>` after giving it `id="main"`; avoid nested landmarks. Replace the landing page's existing nav with `MainNav` in a small client shell using `usePathname()` for `currentPath`. Supply `showEmployer` from a verified role; it is presentation only. Its links are plain anchors and pages need real routes before release.
5. Keep existing landing content and shared contracts. `Button` defaults to `type="button"`; `Input` and `Textarea` link labels/hints/errors. The copied brand image lives at `/brand/careerforge.webp` and preserves original proportions.

RootLayout supplies the one global provider/startup script; RootShell currently wraps only Home. PR #17 removes the nested profile provider. Its input remains initialProfile: StudentProfile; it still renders the same fictional form/header/skip target, and ThemeToggle now gets context from RootLayout. Acceptance: theme switches on Home and Profile, survives navigation/reload, and profile editing/validation stays intact. The profile header/toggle/skip link remain necessary until Dallas applies RootShell there. Any later shell change must update those elements, skip target and owner-specific tests together.

Verification for that cleanup: production build/type validation pass, npm test 16/16 pass, and the complete discovered smoke suite using the existing temporary installed-Edge/reused-server override passes 32 with 6 simulated callback cases intentionally skipped. Includes Home/Profile theme persistence, both screen widths/themes, job preview and existing profile validation. Manual Home → toggle → Profile → toggle → Home → reload confirmed the chosen preference persists. Secretlint changed component and browser bundles: no findings. No extra behavior/test was invented for this provider refactor; existing integration checks were used. Real auth, save/reload persistence, RLS/isolation, deployment and complete judge demo remain unverified pending the backend.

Standards audit: existing unit/schema/mapper checks cover the logic; real Next.js/browser journeys cover integration and manual/automated use; separately managed profile tests pass 7/7, including all simulated save success/error/conflict callbacks omitted by normal smoke. Screens are checked at 390×844 and 1280×800 in light/dark, with keyboard/focus, empty/invalid/repeated actions and theme-only localStorage. Fixtures are labelled and contain no real student data; no schema/role/security bypass was added. This refactor preserves behavior, so no redundant implementation-mirroring unit test was added.

Remaining Steve deliverables are explicit: real own-profile/API save and reload persistence, two-user/foreign-fact denial, saved-application UI/routes with status/notes/deadlines and inactive/unavailable summaries, plus Card/Badge primitives when consumed. They are not complete or security-verified. No standalone lint script, live AI, deployed journey or complete judge demo is claimed. The repository workflow runs install/typecheck/unit/build/Chromium smoke; it does not itself run a deployment. Check PR #17's latest GitHub checks for the final head rather than treating an earlier green run as final evidence.

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

That palette milestone proved system preference; Dallas has since integrated the landing toggle and startup script, and PR #17 verifies remembered manual theme across Home/Profile. Real profile persistence and isolation still need verified clients/adapters. The remaining unrun security/deployment checks are listed above.
