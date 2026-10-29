export type ThemePreference = 'light' | 'dark' | 'system';
export const themeStorageKey = 'gt.ui.theme';
const themeEvent = 'gt-theme-change';
export const normalizeTheme = (value: string | null | undefined): ThemePreference =>
  value === 'light' || value === 'dark' ? value : 'system';

function storedPreference(): ThemePreference {
  try { return normalizeTheme(localStorage.getItem(themeStorageKey)); } catch { return 'system'; }
}

export function getThemePreference(): ThemePreference {
  return normalizeTheme(document.documentElement.dataset.themePreference ?? storedPreference());
}

function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark' || preference === 'system' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const color = getComputedStyle(document.documentElement).getPropertyValue('--ul-bg-page').trim();
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta && color) meta.content = color;
}

export function initializeTheme() { applyTheme(storedPreference()); }

export function setThemePreference(preference: ThemePreference) {
  applyTheme(preference);
  try { localStorage.setItem(themeStorageKey, preference); } catch { /* Mantém a escolha nesta aba. */ }
  window.dispatchEvent(new Event(themeEvent));
}

export function subscribeTheme(notify: () => void) {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  const onSystemChange = () => { applyTheme(getThemePreference()); notify(); };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== themeStorageKey && event.key !== null) return;
    applyTheme(normalizeTheme(event.newValue)); notify();
  };
  window.addEventListener(themeEvent, notify);
  window.addEventListener('storage', onStorage);
  media?.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener(themeEvent, notify);
    window.removeEventListener('storage', onStorage);
    media?.removeEventListener('change', onSystemChange);
  };
}
