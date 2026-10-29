import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import bootstrap from '../../public/theme-init.js?raw';
import { ThemeSelector } from './ThemeSelector';
import { initializeTheme, themeStorageKey } from './theme';

let dark = false;
let listeners: Set<() => void>;
beforeEach(() => {
  dark = false; listeners = new Set();
  localStorage.removeItem(themeStorageKey);
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
  vi.stubGlobal('matchMedia', vi.fn(() => ({ get matches() { return dark; },
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.removeItem(themeStorageKey);
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themePreference;
});

it('salva escolha explicita e restaura depois de recarregar', () => {
  initializeTheme(); const page = render(<ThemeSelector />);
  fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'dark' } });
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem(themeStorageKey)).toBe('dark');
  page.unmount(); delete document.documentElement.dataset.themePreference;
  initializeTheme(); render(<ThemeSelector />);
  expect((screen.getByLabelText('Tema') as HTMLSelectElement).value).toBe('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
});

it('acompanha o sistema ao vivo, preserva escolha explicita e remove listeners', () => {
  initializeTheme(); const page = render(<ThemeSelector />);
  act(() => { dark = true; listeners.forEach(listener => listener()); });
  expect(document.documentElement.dataset.theme).toBe('dark');
  fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'light' } });
  act(() => { listeners.forEach(listener => listener()); });
  expect(document.documentElement.dataset.theme).toBe('light');
  fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'system' } });
  expect(document.documentElement.dataset.theme).toBe('dark');
  page.unmount(); expect(listeners.size).toBe(0);
});

it('sincroniza abas, ignora armazenamento de sessao e normaliza valor invalido', () => {
  initializeTheme(); render(<ThemeSelector />);
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'gt.auth.session', newValue: 'ignorar' })));
  expect(document.documentElement.dataset.theme).toBe('light');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: themeStorageKey, newValue: 'dark' })));
  expect((screen.getByLabelText('Tema') as HTMLSelectElement).value).toBe('dark');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: themeStorageKey, newValue: 'invalido' })));
  expect((screen.getByLabelText('Tema') as HTMLSelectElement).value).toBe('system');
});

it('continua funcionando quando o navegador bloqueia o armazenamento', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
  initializeTheme(); render(<ThemeSelector />);
  fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'dark' } });
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect((screen.getByLabelText('Tema') as HTMLSelectElement).value).toBe('dark');
});

it('restaura tema antes do React e aceita sistema quando armazenamento e invalido', () => {
  localStorage.setItem(themeStorageKey, 'dark'); new Function(bootstrap)();
  expect(document.documentElement.dataset.theme).toBe('dark');
  localStorage.setItem(themeStorageKey, 'invalido'); dark = false; new Function(bootstrap)();
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(document.documentElement.dataset.themePreference).toBe('system');
});
