import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ResumoPerfil } from './ResumoPerfil';
import { CaminhaoPerfilPage } from '../../pages/CaminhaoPerfilPage';
import { FinanceiroPage } from '../../pages/FinanceiroPage';
import { viagensApi } from '../viagens/viagensApi';
import { despesasApi } from '../despesas/despesasApi';
import { caminhoesApi } from '../caminhoes/caminhoesApi';
import { financeiroApi } from './financeiroApi';
import type { Viagem } from '../viagens/types';
import type { Despesa } from '../despesas/types';

const viagem: Viagem = { id: 'v1', motoristaId: 'm1', motoristaNome: 'Marina', motoristaAtivo: false,
  caminhaoId: 'c1', caminhaoPlaca: 'ABC1234', caminhaoAtivo: false, origem: 'Curitiba', destino: 'Santos',
  dataViagem: '2030-01-10', dataCadastro: '', valorFrete: 1000, status: 'Concluída' };
const despesa: Despesa = { id: 'd1', viagemId: 'v1', viagem: null, descricao: 'Combustível', categoria: 'Operação',
  valor: 100, dataDespesa: '2030-01-11', dataCadastro: '', considerarNoFinanceiro: true };

beforeEach(() => {
  window.history.replaceState(null, '', '#/motoristas?motoristaId=m1&aba=resumo');
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]);
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([despesa]);
  vi.spyOn(caminhoesApi, 'obter').mockResolvedValue({ id: 'c1', placa: 'ABC1234', modelo: 'Volvo', ativo: false, dataCadastro: '' });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});

it('perfil mostra vínculos e abre viagem sem alterar os dados', async () => {
  render(<ResumoPerfil tipo="motorista" id="m1" />);
  await screen.findByText('Fretes previstos no período');
  expect(screen.getByRole('link', { name: 'ABC1234' }).getAttribute('href')).toContain('caminhaoId=c1');
  expect(within(screen.getByRole('region', { name: 'Despesas do período' })).getByText('Combustível')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Detalhes da viagem Curitiba para Santos' }));
  const dialog = await screen.findByRole('dialog'); expect(within(dialog).getByText('Curitiba')).toBeTruthy();
});
it('filtra totais, viagens e despesas por suas respectivas datas sem novas consultas', async () => {
  render(<ResumoPerfil tipo="motorista" id="m1" />); await screen.findByText('Fretes previstos no período');
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2030-01-11' } });
  expect(screen.getByText('Nenhuma viagem neste período.')).toBeTruthy();
  expect(screen.getByText('Combustível')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2030-01-09' } });
  expect(screen.getByRole('alert').textContent).toContain('A data inicial');
  expect(screen.queryByText('Fretes previstos no período')).toBeNull();
  expect(viagensApi.listar).toHaveBeenCalledTimes(1);
});
it('falha não apresenta totais e permite recuperar a consulta', async () => {
  vi.mocked(despesasApi.listar).mockRejectedValueOnce(new Error('Offline'));
  render(<ResumoPerfil tipo="motorista" id="m1" />);
  await screen.findByRole('alert'); expect(screen.queryByText('Fretes previstos no período')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Recarregar operação' }));
  await screen.findByText('Fretes previstos no período');
});
it('perfil do caminhão inativo preserva dados e liga aos motoristas', async () => {
  render(<CaminhaoPerfilPage caminhaoId="c1" />);
  await screen.findByRole('heading', { level: 1, name: 'ABC1234' });
  expect(screen.getByText('Inativo')).toBeTruthy();
  const link = await screen.findByRole('link', { name: 'Marina' });
  expect(link.getAttribute('href')).toContain('motoristaId=m1');
  fireEvent.click(screen.getByRole('button', { name: 'Editar caminhão' }));
  const dialog = await screen.findByRole('dialog'); expect((within(dialog).getByLabelText(/^Placa/) as HTMLInputElement).value).toBe('ABC1234');
});
it('cadastro inexistente não exibe uma operação vazia como se fosse um perfil válido', async () => {
  vi.mocked(caminhoesApi.obter).mockRejectedValue(new Error('404'));
  render(<CaminhaoPerfilPage caminhaoId="ausente" />);
  await screen.findByRole('alert'); expect(viagensApi.listar).not.toHaveBeenCalled();
});
it('herda período da URL e o transfere ao dashboard', async () => {
  window.history.replaceState(null, '', '#/caminhoes?caminhaoId=c1&inicio=2030-01-11&fim=2030-01-12');
  render(<ResumoPerfil tipo="caminhao" id="c1" />);
  await screen.findByText('Nenhuma viagem neste período.');
  expect(screen.getByText('Combustível')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Ver dashboard no período' }).getAttribute('href')).toBe('#/financeiro?inicio=2030-01-11&fim=2030-01-12');
});
it('dashboard correlaciona e mantém o período nos links dos perfis', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockResolvedValue({ dataInicial: null, dataFinal: null,
    totalFretes: 1000, totalDespesas: 100, totalDespesasGerais: 0, totalDespesasViagens: 100, totalRemuneracaoMotoristas: 0, lucro: 900 });
  render(<FinanceiroPage />);
  const region = await screen.findByRole('region', { name: 'Motoristas e caminhões no período' });
  expect(within(region).getByRole('link', { name: 'Abrir perfil de Marina' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2030-01-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar período' }));
  await waitFor(() => expect(screen.getByRole('link', { name: 'Abrir perfil de Marina' }).getAttribute('href')).toContain('inicio=2030-01-01'));
});
