import { useId, useSyncExternalStore } from 'react';
import { getThemePreference, setThemePreference, subscribeTheme } from './theme';
import type { ThemePreference } from './theme';
import styles from './components.module.css';

export function ThemeSelector() {
  const id = useId();
  const preference = useSyncExternalStore(subscribeTheme, getThemePreference);
  return <div className={styles.themeSelector}>
    <label htmlFor={id}>Tema</label>
    <select id={id} value={preference} onChange={event => setThemePreference(event.target.value as ThemePreference)}>
      <option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Sistema</option>
    </select>
  </div>;
}
