import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FechamentosPage } from '../../pages/FechamentosPage';
import { fechamentosApi } from './fechamentosApi';
import type { AcertoFechamento, PreviaFechamento } from './fechamentosApi';
import { motoristasApi } from '../motoristas/motoristasApi';
import { caminhoesApi } from '../caminhoes/caminhoesApi';
import { HttpError } from '../../api/http';
const previa: PreviaFechamento = {
  filtros: { dataInicial: '2026-10-01', dataFinal: '2026-10-31', motoristaId: null, caminhaoId: null, situacoes: [], categoria: null, incluirDespesasGerais: true },
  motoristaNome: null, caminhaoPlaca: null,
  totais: { totalFretes: 1000, totalDespesasViagens: 150, totalDespesasGerais: 0, totalDespesas: 150, totalRemuneracaoMotoristas: 150, resultado: 850, quantidadeViagens: 1, quantidadeDespesas: 1 },
  viagens: [{ id: 'v1', dataViagem: '2026-10-10', origem: 'Coleta', destino: 'Entrega', motoristaId: 'm1', motoristaNome: 'Nome preservado', caminhaoId: 'c1', caminhaoPlaca: 'ABC1234', situacao: 'Concluída', valorFrete: 1000, incluidaNaReceita: true }],
  despesas: [{ id: 'd1', dataDespesa: '2026-10-10', descricao: 'Comissão', categoria: 'Motorista', valor: 150, origem: 'RemuneracaoMotorista', viagemId: 'v1', motoristaId: 'm1', motoristaNome: 'Nome preservado', caminhaoId: 'c1', caminhaoPlaca: 'ABC1234', situacaoViagem: 'Concluída' }],
  avisos: ['A remuneração já integra as despesas.'], versaoPrevia: 'A'.repeat(64),
};
const acerto: AcertoFechamento = { id: 'acerto-1', titulo: 'Acerto de outubro', dataInicial: '2026-10-01', dataFinal: '2026-10-31', dataCriacao: '2026-11-03T20:00:00Z', usuarioId: 'usuario-1', versaoFormato: 1, conteudo: previa };
beforeEach(() => {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([]); vi.spyOn(caminhoesApi, 'listar').mockResolvedValue([]);
  vi.spyOn(fechamentosApi, 'previa').mockImplementation(async filtros => ({ ...previa, filtros }));
  vi.spyOn(fechamentosApi, 'salvar').mockResolvedValue(acerto);
  vi.spyOn(fechamentosApi, 'listar').mockResolvedValue({ itens: [], pagina: 1, tamanhoPagina: 20, quantidadeTotal: 0 });
  vi.spyOn(fechamentosApi, 'detalhes').mockResolvedValue(acerto);
});
afterEach(() => vi.restoreAllMocks());
async function consultar() {
  await waitFor(() => expect((screen.getByRole('button', { name: 'Consultar prévia' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-10-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Consultar prévia' }));
  await screen.findByRole('heading', { name: 'Prévia para conferência' });
}
it('consulta somente por ação explícita, mostra custos e invalida a prévia ao alterar filtros', async () => {
  render(<FechamentosPage />); expect(fechamentosApi.previa).not.toHaveBeenCalled(); await consultar();
  expect(screen.getByRole('heading', { name: 'Resultado do fechamento' })).toBeTruthy();
  expect(screen.getByText('A remuneração já integra as despesas.')).toBeTruthy();
  expect(fechamentosApi.salvar).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Categoria da despesa'), { target: { value: 'Combustível' } });
  expect(screen.queryByRole('heading', { name: 'Prévia para conferência' })).toBeNull();
});
it('salva somente uma prévia conferida com período e abre o histórico preservado', async () => {
  render(<FechamentosPage />); await consultar();
  expect((screen.getByRole('button', { name: 'Salvar acerto conferido' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Título do acerto'), { target: { value: 'Acerto de outubro' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar acerto conferido' }));
  await screen.findByRole('region', { name: 'Acerto preservado' });
  expect(fechamentosApi.salvar).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Acerto de outubro', versaoPrevia: previa.versaoPrevia, filtros: previa.filtros, chaveRequisicao: expect.any(String) }), expect.any(AbortSignal));
  expect(screen.getByText(/não é recalculado/)).toBeTruthy();
  expect(within(screen.getByRole('region', { name: 'Viagens do fechamento' })).getByText(/Nome preservado/)).toBeTruthy();
});
it('preserva a chave para nova tentativa após resposta perdida', async () => {
  vi.mocked(fechamentosApi.salvar).mockRejectedValueOnce(new Error('Conexão interrompida.')).mockResolvedValue(acerto);
  render(<FechamentosPage />); await consultar();
  fireEvent.change(screen.getByLabelText('Título do acerto'), { target: { value: 'Acerto de outubro' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar acerto conferido' }));
  await screen.findByText(/Conexão interrompida/);
  fireEvent.click(screen.getByRole('button', { name: 'Salvar acerto conferido' }));
  await screen.findByRole('region', { name: 'Acerto preservado' });
  expect(vi.mocked(fechamentosApi.salvar).mock.calls[0][0].chaveRequisicao).toBe(vi.mocked(fechamentosApi.salvar).mock.calls[1][0].chaveRequisicao);
});
it('conflito exige nova consulta sem substituir a prévia silenciosamente', async () => {
  vi.mocked(fechamentosApi.salvar).mockRejectedValue(new HttpError(409, 'Conflito'));
  render(<FechamentosPage />); await consultar(); fireEvent.change(screen.getByLabelText('Título do acerto'), { target: { value: 'Acerto' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar acerto conferido' }));
  await screen.findByText(/A prévia mudou/);
  expect(screen.queryByRole('button', { name: 'Salvar acerto conferido' })).toBeNull();
  expect(fechamentosApi.previa).toHaveBeenCalledOnce();
});
it('período aberto permite consulta mas exige datas para salvar', async () => {
  render(<FechamentosPage />); await consultar();
  fireEvent.click(screen.getByRole('button', { name: 'Todo o histórico' }));
  fireEvent.click(screen.getByRole('button', { name: 'Consultar prévia' }));
  await screen.findByText(/Para salvar, defina as duas datas/);
  expect((screen.getByRole('button', { name: 'Salvar acerto conferido' }) as HTMLButtonElement).disabled).toBe(true);
});
it('lista acertos paginados e abre os dados salvos sem consultar a operação atual', async () => {
  vi.mocked(fechamentosApi.listar).mockResolvedValue({ itens: [{ ...acerto, totais: previa.totais }], pagina: 1, tamanhoPagina: 20, quantidadeTotal: 21 });
  render(<FechamentosPage />); fireEvent.click(screen.getByRole('button', { name: 'Acertos salvos' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Ver acerto Acerto de outubro' }));
  await screen.findByRole('region', { name: 'Acerto preservado' }); expect(fechamentosApi.previa).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
  await waitFor(() => expect(fechamentosApi.listar).toHaveBeenLastCalledWith(2, expect.any(AbortSignal)));
});
it('falha na consulta informa erro sem exibir totais zerados', async () => {
  vi.mocked(fechamentosApi.previa).mockRejectedValue(new Error('Não foi possível consultar.'));
  render(<FechamentosPage />);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Consultar prévia' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Consultar prévia' }));
  await screen.findByText('Não foi possível consultar.'); expect(screen.queryByRole('heading', { name: 'Resultado do fechamento' })).toBeNull();
});
