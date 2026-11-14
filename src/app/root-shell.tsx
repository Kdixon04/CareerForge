'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MainNav } from '../components/nav/MainNav';
import { ThemeToggle } from '../components/theme/ThemeToggle';

// Only routes that actually exist today are listed. There is intentionally no
// employer link: employer access requires a server-verified role, which does not
// exist in this slice, and a presentation-only flag must never surface it. Jobs and
// Saved are deliberately omitted until those routes are built.
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/profile', label: 'Profile' },
];

/**
 * Dallas-owned landing chrome. It uses Steve's shared `MainNav` (passing only the
 * routes that exist today), `.cf-skip` skip link and theme toggle, and bridges the
 * top-level page surface to the theme tokens so light/dark visibly affects the real
 * landing page.
 */
export function RootShell({ children }: { children: ReactNode }) {
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
          <MainNav currentPath={pathname} links={NAV_LINKS} />
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
