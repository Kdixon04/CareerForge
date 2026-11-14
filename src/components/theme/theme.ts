export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'careerforge-theme';
export function resolveTheme(saved: unknown, systemDark: boolean): Theme {
  return saved === 'light' || saved === 'dark' ? saved : systemDark ? 'dark' : 'light';
}
// Static, application-owned code only. No user-provided values are interpolated.
export const THEME_INIT_SCRIPT = `(function(){var saved=null;try{saved=localStorage.getItem('careerforge-theme')}catch(e){}var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=saved==='light'||saved==='dark'?saved:dark?'dark':'light';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme})()`;
