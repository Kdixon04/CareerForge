'use client';

import { Button } from '../ui/Button';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <Button variant="secondary" disabled={theme === null} aria-label="Dark theme" aria-pressed={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
    <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
    {theme === 'dark' ? 'Dark theme' : 'Light theme'}
  </Button>;
}
