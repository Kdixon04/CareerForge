# Handoff to Steve — `MainNav` link flexibility (+ PR #10 note)

Dallas-owned coordination note (not a Steve-owned file). Written after the root-shell integration landed on `main` (PR #12, merge commit `376e8d3`). It requests a change to one Steve-owned component and flags a behavioral issue in Steve's open PR #10.

## 1. `MainNav` — let the caller choose the visible links

**File:** `src/components/nav/MainNav.tsx`

**Current behavior (on `main` today):** `MainNav` hardcodes its link list, so it always renders Profile, Find jobs (`/jobs`), and Saved (`/saved`), plus an Employer link when `showEmployer` is true:

```tsx
export type MainNavProps = {
  currentPath: string;
  showEmployer?: boolean;
};

export function MainNav({ currentPath, showEmployer = false }: MainNavProps) {
  const links = [
    { href: '/profile', label: 'Profile' },
    { href: '/jobs', label: 'Find jobs' },
    { href: '/saved', label: 'Saved' },
    ...(showEmployer ? [{ href: '/employer/jobs', label: 'Employer' }] : []),
  ];
  return <nav className="cf-nav" aria-label="Main navigation">
    {links.map(({ href, label }) => <a key={href} href={href} aria-current={currentPath === href || currentPath.startsWith(`${href}/`) ? 'page' : undefined}>{label}</a>)}
  </nav>;
}
```

**Problem:** `/jobs` and `/saved` do **not** exist yet. The Dallas root shell (`src/app/root-shell.tsx`) therefore cannot use `MainNav` without rendering dead links, so it currently renders its own minimal `<nav className="cf-nav">` listing only live routes (Home + Profile). We want a single shared `MainNav` instead of two navs.

**Requested change:** let the caller supply which links to show, keeping today's list as the default so nothing else breaks. Preferred option — an optional `links` prop:

Before:

```tsx
export type MainNavProps = {
  currentPath: string;
  showEmployer?: boolean;
};
```

After:

```tsx
export type NavLink = { href: string; label: string };

export type MainNavProps = {
  currentPath: string;
  showEmployer?: boolean;
  /**
   * When provided, replaces the default link list. Lets callers show only
   * routes that exist (e.g. the root shell passes Home + Profile today and
   * adds Jobs/Saved as those pages land). When omitted, the current default
   * list is used so existing call sites are unchanged.
   */
  links?: NavLink[];
};
```

Implementation sketch (keep your `aria-current`/`startsWith` logic and `.cf-nav` markup exactly as-is):

```tsx
export function MainNav({ currentPath, showEmployer = false, links }: MainNavProps) {
  const defaultLinks: NavLink[] = [
    { href: '/profile', label: 'Profile' },
    { href: '/jobs', label: 'Find jobs' },
    { href: '/saved', label: 'Saved' },
  ];
  const baseLinks = links ?? defaultLinks;
  const resolved = showEmployer
    ? [...baseLinks, { href: '/employer/jobs', label: 'Employer' }]
    : baseLinks;
  // ...render `resolved` exactly as before...
}
```

Alternative if you prefer flags over a list: add `showJobs?: boolean` and `showSaved?: boolean` that default to `true` (current behavior), mirroring the existing `showEmployer` flag. Either shape is fine; the `links` prop is preferred because the shell can then pass an exact live-route list.

Keep `showEmployer` presentation-only — the root shell gates it on a **server-verified** role at the call site, never a client flag.

**What the shell will do once this lands:**
1. `src/app/root-shell.tsx` will drop its inline `<nav>` and render `<MainNav currentPath={pathname} links={[{ href: '/', label: 'Home' }, { href: '/profile', label: 'Profile' }]} />`, adding Jobs/Saved entries as those routes ship.
2. Per your `HANDOFF.md`, you can then remove the now-redundant local `ThemeProvider`, duplicate header/toggle, and profile-only skip link from `src/app/(student)/profile/ProfilePreview.tsx`, and point the profile skip target at the root `id="main"`.

## 2. PR #10 (`feature/steve-shell-colors`) — focus-order needs a refresh

Your landing-palette work has **no textual/file merge conflict** with current `main` (it only touches `src/app/globals.css`, `tests/e2e/steve-shell.spec.ts`, `src/components/ui/HANDOFF.md`, and `assignments/steve-rogers.md`; PR #12 touched none of those). Its color/contrast/no-JS assertions still pass.

However, when PR #10 is rebased/updated onto current `main` and CI re-runs, **8 of its 10 `steve-shell.spec.ts` tests fail** (verified locally via a throwaway merge + build). Root cause: PR #12's root shell added a **`Skip to content`** link, a Home/Profile nav, and a theme toggle **before** the hero, so the tab order changed. The test still assumes the old order:

```
await page.keyboard.press('Tab');
await expect(page.getByRole('link', { name: 'Career Forge home' })).toBeFocused();  // now focus is on "Skip to content" first
await page.keyboard.press('Tab');
await expect(page.getByRole('link', { name: 'Explore the foundation' })).toBeFocused();
```

Requested fix (your file to edit): update the focus-order expectations in `tests/e2e/steve-shell.spec.ts` to account for the new leading `Skip to content` link, nav links, and toggle — e.g. assert the skip link is focused first, then step through to the brand/action — or scope the focus checks to the specific elements rather than absolute Tab counts. The color/contrast/system-preference assertions can stay as they are.
