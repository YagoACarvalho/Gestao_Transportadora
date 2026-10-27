import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

vi.mock('../pages/MotoristasPage', () => ({ MotoristasPage: () => <h1>Motoristas teste</h1> }));
vi.mock('../pages/MotoristaPerfilPage', () => ({ MotoristaPerfilPage: ({ motoristaId, aba }: { motoristaId: string; aba: string }) => <h1>Perfil {motoristaId}: {aba}</h1> }));
vi.mock('../pages/CaminhoesPage', () => ({ CaminhoesPage: () => <h1>Caminhões teste</h1> }));
vi.mock('../pages/ViagensPage', () => ({ ViagensPage: () => <h1>Viagens teste</h1> }));
vi.mock('../pages/DespesasPage', () => ({ DespesasPage: () => <h1>Despesas teste</h1> }));
vi.mock('../pages/FinanceiroPage', () => ({ FinanceiroPage: () => <h1>Financeiro teste</h1> }));
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
it.each([['despesas', 'Despesas teste', 'Despesas'], ['financeiro', 'Financeiro teste', 'Resumo financeiro']])('abre %s por URL com navegacao real', (modulo, heading, titulo) => {
  window.history.replaceState(null, '', `#/${modulo}`);
  render(<AppShell />);
  expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
  expect(screen.getByRole('link', { name: titulo }).getAttribute('aria-current')).toBe('page');
  expect(document.title).toBe(`${titulo} | Gestão de Transportadora`);
});

it('reconhece o modulo despesas em URL com viagem preselecionada', () => {
  window.history.replaceState(null, '', '#/despesas?viagemId=viagem-teste');
  render(<AppShell />);
  expect(screen.getByRole('heading', { name: 'Despesas teste' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Despesas' }).getAttribute('aria-current')).toBe('page');
});

it('abre perfil e aba por URL preservando navegacao do modulo e historico', async () => {
  window.history.replaceState(null, '', '#/motoristas?motoristaId=id%2Fteste&aba=viagens');
  render(<AppShell />);
  expect(screen.getByRole('heading', { name: 'Perfil id/teste: viagens' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Motoristas' }).getAttribute('aria-current')).toBe('page');
  expect(document.title).toBe('Perfil do motorista | Gestão de Transportadora');
  act(() => { window.location.hash = '#/motoristas?motoristaId=id%2Fteste&aba=remuneracao'; });
  await screen.findByRole('heading', { name: 'Perfil id/teste: remuneracao' });
  act(() => window.history.back());
  await screen.findByRole('heading', { name: 'Perfil id/teste: viagens' });
  fireEvent.click(screen.getByRole('link', { name: 'Motoristas' }));
  await screen.findByRole('heading', { name: 'Motoristas teste' });
});

it('usa cadastro quando a URL informa uma aba desconhecida', () => {
  window.history.replaceState(null, '', '#/motoristas?motoristaId=m1&aba=inexistente');
  render(<AppShell />);
  expect(screen.getByRole('heading', { name: 'Perfil m1: cadastro' })).toBeTruthy();
});
