export type MainNavProps = {
  currentPath: string;
  showEmployer?: boolean;
};

// Ordinary anchors keep this first slice independent of framework routing setup.
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
