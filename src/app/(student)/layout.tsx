import type { ReactNode } from 'react';
import { RootShell, STUDENT_NAV_LINKS } from '../root-shell';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <RootShell links={STUDENT_NAV_LINKS}>{children}</RootShell>;
}