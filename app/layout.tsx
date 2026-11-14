import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Career Forge', description: 'A grounded career launchpad for students.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
