import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { FinanceiroPage } from '../../pages/FinanceiroPage';
import { financeiroApi } from './financeiroApi';
import { request } from '../../api/http';
import { despesasApi } from '../despesas/despesasApi';
import { viagensApi } from '../viagens/viagensApi';

const resumo = { dataInicial: null, dataFinal: null, totalFretes: 100, totalDespesas: 25, totalDespesasViagens: 10, totalDespesasGerais: 15, totalRemuneracaoMotoristas: 0, lucro: 75 };
beforeEach(() => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([]); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  // jsdom não mede SVG: os gráficos usam a dimensão inicial; tabelas validam valores.
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});

it('destaca remuneracao como parcela ja incluida sem subtrair novamente do saldo', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockResolvedValue({ ...resumo, totalRemuneracaoMotoristas: 5 });
  render(<FinanceiroPage />); const indicador = await screen.findByRole('region', { name: 'Remuneração dos motoristas' });
  expect(within(indicador).getByText(/R\$\s*5,00/)).toBeTruthy();
  expect(within(indicador).getByText(/já incluídas no total/)).toBeTruthy();
  expect(screen.getByText(/R\$\s*75,00/)).toBeTruthy();
});
it('apresenta saldo previsto e aplica periodo somente por acao explicita', async () => {
  const api = vi.spyOn(financeiroApi, 'resumo').mockResolvedValue(resumo); render(<FinanceiroPage />);
  await screen.findByText('Saldo previsto'); expect(screen.queryByText(/^Lucro$/)).toBeNull();
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2030-01-02' } });
  fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2030-01-03' } }); expect(api).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar período' }));
  await waitFor(() => expect(api).toHaveBeenLastCalledWith('2030-01-02', '2030-01-03', expect.any(AbortSignal)));
});
it('bloqueia periodo invertido sem consultar API', async () => {
  const api = vi.spyOn(financeiroApi, 'resumo').mockResolvedValue(resumo); render(<FinanceiroPage />); await screen.findByText('Saldo previsto');
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2030-02-01' } });
  fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2030-01-01' } });
  expect((screen.getByRole('button', { name: 'Aplicar período' }) as HTMLButtonElement).disabled).toBe(true); expect(api).toHaveBeenCalledTimes(1);
});
it('nao apresenta zeros em caso de erro e permite nova tentativa', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockRejectedValueOnce(new Error('Sem conexão.')).mockResolvedValue(resumo);
  render(<FinanceiroPage />); await screen.findByText('Sem conexão.'); expect(screen.queryByText('Saldo previsto')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Saldo previsto');
});
it('usa URL relativa e datas civis no contrato existente', async () => {
  const mock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(resumo))); vi.stubGlobal('fetch', mock);
  await financeiroApi.resumo('2030-01-02', '2030-01-03');
  expect(mock.mock.calls[0][0]).toBe('/api/Relatorios/resumo-financeiro?dataInicial=2030-01-02&dataFinal=2030-01-03');
  await expect(request('/api/Relatorios/resumo-financeiro')).resolves.toEqual(resumo);
});

it('informa incompatibilidade se a API ainda nao tiver os totais separados', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ totalFretes: 100, totalDespesas: 25, lucro: 75 }))));
  await expect(financeiroApi.resumo('', '')).rejects.toThrow('O resumo financeiro está incompleto. Atualize a API e tente novamente.');
});

it('apresenta a separacao dos custos e estados vazios sem inventar series', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockResolvedValue(resumo); render(<FinanceiroPage />);
  await screen.findByText('Despesas de viagens');
  expect(screen.getByText('Despesas gerais')).toBeTruthy();
  const totais = screen.getByRole('region', { name: 'Resumo financeiro' });
  expect(within(totais).getByText(/R\$\s*10,00/)).toBeTruthy(); expect(within(totais).getByText(/R\$\s*15,00/)).toBeTruthy();
  await screen.findByText('Nenhum registro com data neste período.');
  expect(screen.queryByRole('table')).toBeNull();
});

it('destaca saldo acumulado e soma total sem inventar participacao quando nao ha despesas', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockResolvedValue({ ...resumo, totalFretes: 0, totalDespesas: 0, totalDespesasViagens: 0, totalDespesasGerais: 0, lucro: 0 });
  render(<FinanceiroPage />);
  await screen.findByText('Total acumulado de todo o histórico');
  expect(screen.getByText('Total de despesas')).toBeTruthy();
  await screen.findByText('Nenhuma despesa para compor o gráfico.');
  expect(screen.queryByText('NaN%')).toBeNull(); expect(screen.queryByRole('img')).toBeNull();
});

it('preserva saldo negativo e nao desenha rosca enganosa para despesas legadas negativas', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockResolvedValue({ ...resumo, totalDespesas: 150, totalDespesasViagens: -5, totalDespesasGerais: 155, lucro: -50 });
  render(<FinanceiroPage />);
  await screen.findByText(/A composição em rosca não representa valores negativos/);
  const totais = screen.getByRole('region', { name: 'Resumo financeiro' });
  expect(within(totais).getByText(/-R\$\s*50,00/)).toBeTruthy();
  expect(screen.queryByRole('img')).toBeNull();
});

it('mostra evolucao, categorias e recentes a partir das consultas reais', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockResolvedValue(resumo);
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([{ id: 'teste', descricao: 'Despesa isolada', categoria: 'Categoria isolada', valor: 25, dataDespesa: '2030-01-02', viagemId: 'cancelada', viagem: null, dataCadastro: '' }]);
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ id: 'cancelada', origem: null, destino: null, dataViagem: '2030-01-02', motoristaId: null, motoristaNome: null, motoristaAtivo: null, caminhaoId: null, caminhaoPlaca: null, caminhaoAtivo: null, valorFrete: 900, status: 'Cancelada', dataCadastro: '' }]);
  render(<FinanceiroPage />);
  const chart = await screen.findByRole('region', { name: 'Evolução mensal' });
  fireEvent.click(within(chart).getByText('Ver valores mensais'));
  const tabela = within(chart).getByRole('table');
  expect(within(tabela).getByText('01/2030')).toBeTruthy(); expect(within(tabela).getByText(/R\$\s*0,00/)).toBeTruthy();
  expect(within(tabela).getByText(/R\$\s*25,00/)).toBeTruthy();
  const recentes = screen.getByRole('heading', { name: 'Últimos lançamentos' }).closest('section')!;
  expect(within(recentes).getByText('Despesa isolada')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Ver e editar despesas' }).getAttribute('href')).toBe('#/despesas');
});

it('preserva os totais se os detalhes falharem e permite recarregar', async () => {
  vi.spyOn(financeiroApi, 'resumo').mockResolvedValue(resumo);
  vi.spyOn(despesasApi, 'listar').mockRejectedValueOnce(new Error('Falha isolada.')).mockResolvedValue([]);
  render(<FinanceiroPage />); await screen.findByText('Não foi possível carregar os gráficos e lançamentos.');
  expect(screen.getByText('Saldo previsto')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Recarregar detalhes' }));
  await screen.findByText('Nenhum registro com data neste período.');
});

it('aplica atalhos com datas civis e permite voltar ao historico', async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2030, 0, 15, 12));
  try {
    const api = vi.spyOn(financeiroApi, 'resumo').mockResolvedValue(resumo); render(<FinanceiroPage />);
    await screen.findByText('Saldo previsto'); fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
    await waitFor(() => expect(api).toHaveBeenLastCalledWith('2029-12-01', '2029-12-31', expect.any(AbortSignal)));
    fireEvent.click(screen.getByRole('button', { name: 'Mês atual' }));
    await waitFor(() => expect(api).toHaveBeenLastCalledWith('2030-01-01', '2030-01-31', expect.any(AbortSignal)));
    fireEvent.click(screen.getByRole('button', { name: 'Todo o histórico' }));
    await waitFor(() => expect(api).toHaveBeenLastCalledWith('', '', expect.any(AbortSignal)));
  } finally { vi.useRealTimers(); }
});
