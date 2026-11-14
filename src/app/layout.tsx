import type { Metadata } from 'next';
import './globals.css';
import '../styles/tokens.css';
import '../styles/components.css';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { THEME_INIT_SCRIPT } from '../components/theme/theme';

export const metadata: Metadata = { title: 'Career Forge', description: 'A grounded career launchpad for students.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // suppressHydrationWarning is scoped to <html> only. The theme-init script sets
  // data-theme/color-scheme on <html> before paint, so the server markup and the
  // client-adjusted attribute intentionally differ on this one element. It does not
  // suppress hydration warnings for <body> or any descendant, so unrelated mismatches
  // still surface.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Static, application-owned script; no user input is interpolated. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
