export type NavLink = { href: string; label: string };

export type MainNavProps = {
  currentPath: string;
  showEmployer?: boolean;
  /**
   * When provided, replaces the default link list so callers can show only
   * routes that exist (e.g. the root shell passes Home + Profile today and adds
   * Jobs/Saved as those pages ship). When omitted, the default list below is
   * used, so existing callers are unchanged.
   */
  links?: NavLink[];
};

// Ordinary anchors keep this first slice independent of framework routing setup.
export function MainNav({ currentPath, showEmployer = false, links }: MainNavProps) {
  const baseLinks: NavLink[] = links ?? [
    { href: '/profile', label: 'Profile' },
    { href: '/jobs', label: 'Find jobs' },
    { href: '/saved', label: 'Saved' },
  ];
  const resolvedLinks = showEmployer
    ? [...baseLinks, { href: '/employer/jobs', label: 'Employer' }]
    : baseLinks;
  return <nav className="cf-nav" aria-label="Main navigation">
    {resolvedLinks.map(({ href, label }) => <a key={href} href={href} aria-current={currentPath === href || currentPath.startsWith(`${href}/`) ? 'page' : undefined}>{label}</a>)}
  </nav>;
}
