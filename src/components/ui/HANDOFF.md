# Steve's design and profile handoff

## Status and limits

No real authentication, saved-application feature, database persistence or AI integration is implemented by this slice. `/profile` is now a real Next.js route with a fictional profile form: display name, career field, and add/edit/remove typed skills, education, projects, experience and interests. It explicitly discloses that changes reset on reload. Save is disabled until the secure adapter arrives; Check profile validates without sending or storing information. The separate component harness's `/saved` remains only an empty-state example. Colors come from the actual logo; its copied asset is byte-identical.

Merged origin/main at `0ac89a1` into feature/steve, preserving the Next.js/React 18 scaffold, provisional shared schemas and fictional examples. Resolved instruction overlap by retaining the short AGENTS.md requested by Steve and preserving Dallas's latest full guidance in AGENTS.reference.md. Added current teammates.md/Will ownership references. Keyan's auth/data adapters are still absent; no API routes or independent database fields were invented.

## Profile integration surface

- `ProfileForm({ initialProfile: StudentProfile, onSave?: (draft: ProfileDraft, expectedUpdatedAt: string) => Promise<StudentProfile> })` in `src/app/(student)/profile/ProfileForm.tsx`. `ProfileDraft` is a Pick of the shared StudentProfile, not a competing shared schema. It excludes userId/updatedAt. The callback is a UI boundary, not an agreed API payload/signature.
- Omitting onSave renders the honest Check profile/disabled Save profile state. Supplying it enables save, disables inputs while pending, prevents duplicate pending submissions, preserves edits on failure/conflict, and carries the returned updatedAt into the next save.
- Map adapter conflict/unavailability into the local UI `ProfileSaveError` when wiring. The callback fixture proves those messages and version handoff, not actual optimistic concurrency or server authorization.
- `ProfilePreview` currently wraps the fictional route with a local ThemeProvider/toggle. Dallas should remove that local wrapper when the shared root shell provides them, and replace the fixture with verified own-profile loading. Do not ship fictional-profile fallback as a real signed-in profile.
- `Textarea` mirrors Input's labelled hint/error pattern and native textarea attributes.
- Frontend bounds: name 120, career field 160, organization 200, date text 100, at most 100 facts / 30,000 combined fact-text characters. Limits are UI safeguards; Keyan/Dallas must confirm server limits. Shared schemas validate UUIDs/kinds; existing evidence ids survive edits. Authorization of fact ownership remains the adapter's responsibility.

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

StudentProfile/StudentFact and fictional examples have now landed and are used directly. Still needed: agreed editable API input, application update schema, adapter signatures, own-record auth, and the optimistic-concurrency request field/header. Steve will not silently add a database field. The installed Zod 3.23.8 has a high production advisory; Dallas must upgrade/revalidate before untrusted API parsing. Frontend fixture validation does not claim the audit is clean.

## Run this independent fixture

Run from the repository root. The actual profile uses README's `npm ci`, `npm run build`, `npm run start` at port 3000; open `/profile`. The optional component/callback harness remains at port 4317. No root manifest, lockfile, layout or team dependency was independently changed. A temporary toolchain supplies esbuild and the alternate browser runner; its versions live in its own package-lock.json.

```powershell
$env:STEVE_TOOLCHAIN = Join-Path $env:TEMP 'careerforge-steve-tools'
# Toolchain prerequisites: Node.js, React/ReactDOM matching the scaffold,
# their type packages, TypeScript 5, esbuild 0.25 and @playwright/test 1.
# Install into STEVE_TOOLCHAIN only, using an available npm installation:
npm install --prefix $env:STEVE_TOOLCHAIN --no-audit --no-fund react@18 react-dom@18 @types/react@18 @types/react-dom@18 @types/node@22 typescript@5 esbuild@0.25 @playwright/test@1
node src/components/ui/examples/serve-preview.mjs
# In another terminal with the same STEVE_TOOLCHAIN:
node src/components/ui/examples/check.mjs
node src/components/ui/examples/check.mjs tests/unit/steve-profile.test.ts
npm run typecheck
$env:STEVE_SCREENSHOTS = Join-Path $env:TEMP 'careerforge-steve-screenshots'
# Defaults to installed Windows Edge. Set STEVE_BROWSER to another Chromium executable if needed.
node src/components/ui/examples/browser-check.mjs
node src/components/ui/examples/browser-check.mjs tests/e2e/steve-profile.spec.ts
```

The local machine has no npm command. For this run, npm 11.6.2 was obtained from its official registry into the temporary toolchain; `node <toolchain>/package/bin/npm-cli.js` substitutes for `npm` above. All generated bundles, runner configuration, screenshots and traces live outside Git. The preview server listens on loopback port 4317 and serves only an explicit asset/route allowlist.

## Verified results

- Initial red run: all three theme/contrast tests failed for missing behavior; implemented theme selection/startup/tokens afterward.
- `check.mjs`: 6/6 pass (theme resolution, startup with blocked/invalid storage, both-theme contrast, native button semantics, label/error linkage and safe text rendering, role-aware navigation presentation).
- `browser-check.mjs`: 6/6 pass, installed Edge via Playwright. Four journeys cover 390×844 and 1280×800 in light/dark; remaining cases cover blocked storage/system changes and the server-rendered first paint before React loads.
- Browser journeys cover keyboard skip link/toggle/visible focus, theme persistence through reload/navigation, empty and whitespace input, error focus/announcement, repeated valid submission, disabled native button, active navigation, saved empty state, no horizontal overflow, logo decoding and zero browser console/page errors.
- Manual in-app browser: empty submit focuses field with error, fictional text + Enter produces explicit unsaved feedback, theme switches and survives reload/navigation. Reviewed all four screenshots; corrected screenshot capture to await logo decoding.
- Contrast assertions measure text/muted/error on background/surface ≥4.5:1; action text ≥4.5:1; border/focus on background/surface ≥3:1. Disabled/decorative elements are not claimed to meet active-control contrast.
- Secretlint with its recommended rules: no findings in source/tests, Steve's assignment, shared instruction/reference documents or the generated browser JavaScript bundle. No credentials were configured for this fixture.
### Current scaffold/profile verification

- `npm run typecheck`: passes with the scaffold's TypeScript target and React 18. Replaced an unsupported iterator spread in Steve's older test; no root config change.
- `npm test`: shared contracts 7/7 pass. Separate Node unit/component suites: design 6/6 and profile logic 5/5 pass. Profile tests were run red first, then implemented.
- `npm run build`: passes; includes a statically built `/profile` (18.6 kB route / 121 kB first load).
- Focused browser checks: design 6/6 and profile 7/7 pass. Profile includes four production-Next.js viewport/theme journeys plus three explicitly simulated save callbacks (success, failure, conflict). Repeated pending save, retained edits/retry, returned version handoff and empty/invalid/repeated actions covered.
- Scaffold smoke discovery, using original projects/specs with a temporary installed-Edge override and an already running production server: 10 pass, 18 fixture cases intentionally skip. The focused browser runner explicitly enables those component cases with STEVE_COMPONENT_TESTS=1. No Playwright config changes were made. Node test files also execute during broad Playwright discovery; Dallas should separate testMatch to *.spec.ts and add an explicit Node-unit job or agree a unified runner.
- Manual actual `/profile`: add skill, empty-entry error/focus, edit fictional text, Check profile feedback, and documented reset on reload verified. Both 390×844 / 1280×800 themes captured; profile screenshots reviewed.
- Production dependency audit: one inherited high Zod advisory. Initial full npm ci audit: 7 findings (3 moderate, 2 high, 2 critical, including dev dependencies). Dallas owns dependency updates; no automatic audit fix was run.
- NOT RUN: actual auth/adapter save, foreign-fact denial, database/RLS/isolation, real reload persistence, AI, deployment, or complete judge demo. No standalone lint script is present. These remain blockers, not passing checks.
- Secretlint: no findings in the final source, tests, instructions, Next.js static browser chunks or the isolated preview bundle.

## Changed paths

`public/brand/careerforge.webp`; `src/styles/{tokens,components}.css`; `src/components/theme/{theme.ts,ThemeProvider.tsx,ThemeToggle.tsx}`; `src/components/nav/MainNav.tsx`; `src/components/ui/{Button.tsx,Input.tsx,HANDOFF.md}`; `src/components/ui/examples/{DesignPreview.tsx,preview-client.tsx,preview.css,serve-preview.mjs,check.mjs,typecheck.mjs,browser-check.mjs}`; `tests/unit/steve-design.test.ts`; `tests/e2e/steve-design.spec.ts`.

Profile milestone adds `src/app/(student)/profile/{page.tsx,ProfilePreview.tsx,ProfileForm.tsx,profile-model.ts,profile.css}`, `src/components/ui/Textarea.tsx`, `src/components/ui/examples/ProfileTestFixture.tsx`, `tests/unit/steve-profile.test.ts`, and `tests/e2e/steve-profile.spec.ts`; updates the fixture harness/runners, design compatibility/fixture gating, this handoff, and Steve's assignment. AGENTS/reference changes accompany the merge of main, preserving latest shared guidance.

Learning takeaway: semantic tokens describe a color's job, so the same components work in both themes. Native buttons and correctly linked labels preserve browser keyboard behavior instead of recreating it. This slice proves the visual components, not the end-to-end CareerForge product.
