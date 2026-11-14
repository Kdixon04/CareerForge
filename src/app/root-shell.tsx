'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MainNav, type NavLink } from '../components/nav/MainNav';
import { ThemeToggle } from '../components/theme/ThemeToggle';

/** Landing chrome: home plus the full student journey links judges should discover. */
export const HOME_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/profile', label: 'Profile' },
  { href: '/jobs', label: 'Find jobs' },
  { href: '/saved', label: 'Saved' },
  { href: '/calendar', label: 'Calendar' },
];

/** In-app student routes: brand link returns home; omit a redundant Home nav item. */
export const STUDENT_NAV_LINKS: NavLink[] = [
  { href: '/profile', label: 'Profile' },
  { href: '/jobs', label: 'Find jobs' },
  { href: '/saved', label: 'Saved' },
  { href: '/calendar', label: 'Calendar' },
];

/**
 * Dallas-owned shared chrome. It uses Steve's `MainNav`, `.cf-skip` skip link and theme
 * toggle, and bridges student surfaces to the theme tokens for light/dark.
 */
export function RootShell({
  children,
  links = HOME_NAV_LINKS,
}: {
  children: ReactNode;
  links?: NavLink[];
}) {
  const pathname = usePathname() || '/';
  return (
    <div
      className="cf-root"
      style={{
        background: 'var(--cf-bg)',
        color: 'var(--cf-text)',
        minHeight: '100vh',
        fontFamily: 'var(--cf-font)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <a className="cf-skip" href="#main">Skip to content</a>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '1.1rem 6vw',
          borderBottom: '1px solid var(--cf-border)',
        }}
      >
        <a
          href="/"
          aria-label="Career Forge home"
          style={{ color: 'var(--cf-text)', textDecoration: 'none', fontWeight: 750, letterSpacing: '-.03em', fontSize: '1.2rem' }}
        >
          Career Forge
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <MainNav currentPath={pathname} links={links} />
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}