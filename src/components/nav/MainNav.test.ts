import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MainNav, type MainNavProps } from './MainNav';

const render = (props: MainNavProps) => renderToStaticMarkup(createElement(MainNav, props));

describe('MainNav', () => {
  it('renders the default hardcoded links when no links prop is given', () => {
    const html = render({ currentPath: '/profile' });
    expect(html).toContain('href="/profile"');
    expect(html).toContain('>Profile<');
    expect(html).toContain('href="/jobs"');
    expect(html).toContain('>Find jobs<');
    expect(html).toContain('href="/saved"');
    expect(html).toContain('>Saved<');
    // Active-state logic is preserved: the current path is marked.
    expect(html).toContain('aria-current="page"');
  });

  it('renders caller-supplied links instead of the defaults', () => {
    const html = render({
      currentPath: '/',
      links: [{ href: '/', label: 'Home' }, { href: '/profile', label: 'Profile' }],
    });
    expect(html).toContain('href="/"');
    expect(html).toContain('>Home<');
    expect(html).toContain('href="/profile"');
    expect(html).toContain('>Profile<');
    // The hardcoded defaults are gone when links are supplied.
    expect(html).not.toContain('href="/jobs"');
    expect(html).not.toContain('href="/saved"');
  });

  it('shows the employer link only when showEmployer is true', () => {
    const without = render({ currentPath: '/profile' });
    expect(without).not.toContain('href="/employer/jobs"');

    const withEmployer = render({ currentPath: '/profile', showEmployer: true });
    expect(withEmployer).toContain('href="/employer/jobs"');
    expect(withEmployer).toContain('>Employer<');

    // Employer still appends to a caller-supplied link list.
    const withLinksAndEmployer = render({
      currentPath: '/',
      links: [{ href: '/', label: 'Home' }],
      showEmployer: true,
    });
    expect(withLinksAndEmployer).toContain('href="/"');
    expect(withLinksAndEmployer).toContain('href="/employer/jobs"');
  });
});
