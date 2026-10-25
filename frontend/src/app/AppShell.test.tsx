import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

vi.mock('../pages/MotoristasPage', () => ({ MotoristasPage: () => <h1>Motoristas teste</h1> }));
vi.mock('../pages/CaminhoesPage', () => ({ CaminhoesPage: () => <h1>Caminhões teste</h1> }));
vi.mock('../pages/ViagensPage', () => ({ ViagensPage: () => <h1>Viagens teste</h1> }));
beforeEach(() => {
  window.history.replaceState(null, '', '#/motoristas');
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
});
it('navega entre modulos com selecao, titulo e historico', async () => {
  render(<AppShell />);
  expect(screen.getByRole('heading', { name: 'Motoristas teste' })).toBeTruthy();
  fireEvent.click(screen.getByRole('link', { name: 'Caminhões' }));
  await screen.findByRole('heading', { name: 'Caminhões teste' });
  expect(screen.getByRole('link', { name: 'Caminhões' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('link', { name: 'Motoristas' }).getAttribute('aria-current')).toBeNull();
  expect(document.title).toBe('Caminhões | Gestão de Transportadora');
  act(() => window.history.back());
  await screen.findByRole('heading', { name: 'Motoristas teste' });
  act(() => window.history.forward());
  await screen.findByRole('heading', { name: 'Caminhões teste' });
});
it('abre caminhao por URL e mantem o modulo ao pular para o conteudo', async () => {
  window.history.replaceState(null, '', '#/caminhoes');
  render(<AppShell />);
  expect(screen.getByRole('heading', { name: 'Caminhões teste' })).toBeTruthy();
  fireEvent.click(screen.getByRole('link', { name: 'Ir para o conteúdo' }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')));
  expect(window.location.hash).toBe('#/caminhoes');
  expect(screen.getByRole('heading', { name: 'Caminhões teste' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Viagens' }).getAttribute('aria-current')).toBeNull();
});
it('abre viagens por URL e atualiza a navegacao', () => {
  window.history.replaceState(null, '', '#/viagens');
  render(<AppShell />);
  expect(screen.getByRole('heading', { name: 'Viagens teste' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Viagens' }).getAttribute('aria-current')).toBe('page');
  expect(document.title).toBe('Viagens | Gestão de Transportadora');
  expect(screen.getByText('Operação', { selector: 'span' })).toBeTruthy();
});
