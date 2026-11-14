'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { resolveTheme, THEME_STORAGE_KEY, type Theme } from './theme';

type ThemeContextValue = { theme: Theme | null; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setResolvedTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    let preference: string | null = null;
    try { preference = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* In-memory/system fallback. */ }
    const apply = () => {
      const next = resolveTheme(preference, media.matches);
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      setResolvedTheme(next);
    };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        preference = event.newValue;
        apply();
      }
    };
    // A local custom event also works when storage is unavailable.
    const choiceChanged = (event: Event) => {
      preference = (event as CustomEvent<Theme>).detail;
      apply();
    };
    apply();
    media.addEventListener('change', apply);
    window.addEventListener('storage', storageChanged);
    window.addEventListener('careerforge-theme-change', choiceChanged);
    return () => {
      media.removeEventListener('change', apply);
      window.removeEventListener('storage', storageChanged);
      window.removeEventListener('careerforge-theme-change', choiceChanged);
    };
  }, []);

  const setTheme = (next: Theme) => {
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* Theme still works for this page. */ }
    window.dispatchEvent(new CustomEvent('careerforge-theme-change', { detail: next }));
  };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
