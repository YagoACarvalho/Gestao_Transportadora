import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { caminhoesApi } from '../caminhoes/caminhoesApi';
import { DespesasPage } from '../../pages/DespesasPage';
import { despesasApi } from './despesasApi';
import { viagensApi } from '../viagens/viagensApi';
import { HttpError } from '../../api/http';
import type { Despesa } from './types';
import type { Viagem } from '../viagens/types';
beforeEach(() => { vi.spyOn(caminhoesApi, 'listar').mockResolvedValue([]); });

const item: Despesa = { id: 'despesa-teste', descricao: 'Lançamento de teste', categoria: 'Categoria teste', valor: 12.5, dataDespesa: '2030-01-02', viagemId: null, viagem: null, dataCadastro: '2026-01-01T00:00:00Z' };

it('automatica protege valor e exclusao e altera somente situacao financeira pelo PATCH', async () => {
  const automatica: Despesa = { ...item, origem: 'RemuneracaoMotorista', viagemId: 'viagem', considerarNoFinanceiro: true };
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([automatica]); vi.spyOn(despesasApi, 'obter').mockResolvedValue(automatica);
  const patch = vi.spyOn(despesasApi, 'alterarSituacaoFinanceira').mockResolvedValue();
  const put = vi.spyOn(despesasApi, 'atualizar').mockResolvedValue();
  render(<DespesasPage />); await screen.findByText('Automática: 15% do frete');
  expect(screen.queryByRole('button', { name: /Excluir despesa/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Alterar situação financeira de Lançamento de teste' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).queryByLabelText('Valor (obrigatório)')).toBeNull();
  fireEvent.change(within(dialog).getByLabelText('Incluir no financeiro'), { target: { value: 'nao' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar situação financeira' }));
  await screen.findByText('Situação financeira salva.'); expect(patch).toHaveBeenCalledWith(item.id, false); expect(put).not.toHaveBeenCalled();
});

it('separa gerais e de viagens sem novas consultas e prepara o cadastro da aba', async () => {
  const listar = vi.spyOn(despesasApi, 'listar').mockResolvedValue([item, { ...item, id: 'vinculada', descricao: 'Custo de viagem', viagemId: 'viagem' }]);
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  render(<DespesasPage />); await screen.findByText('Lançamento de teste');
  fireEvent.click(screen.getByRole('button', { name: 'De viagens' }));
  expect(screen.queryByText('Lançamento de teste')).toBeNull(); expect(screen.getByText('Custo de viagem')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'De viagens', pressed: true })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar despesa' }));
  const dialog = screen.getByRole('dialog');
  expect((within(dialog).getByLabelText('Tipo de despesa') as HTMLSelectElement).value).toBe('viagem');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Gerais' }));
  expect(screen.queryByText('Custo de viagem')).toBeNull(); expect(screen.getByText('Lançamento de teste')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Todas' })); expect(screen.getByText('Custo de viagem')).toBeTruthy();
  expect(listar).toHaveBeenCalledTimes(1);
});

it('converter despesa vinculada em geral envia null e nao depende da consulta de viagens', async () => {
  const vinculada = { ...item, viagemId: 'viagem' };
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([vinculada]); vi.spyOn(despesasApi, 'obter').mockResolvedValue(vinculada);
  vi.spyOn(viagensApi, 'listar').mockRejectedValue(new Error('Consulta indisponível.'));
  const atualizar = vi.spyOn(despesasApi, 'atualizar').mockResolvedValue();
  render(<DespesasPage />); fireEvent.click(await screen.findByRole('button', { name: 'Editar despesa Lançamento de teste' }));
  const dialog = await screen.findByRole('dialog'); await within(dialog).findByText('Consulta indisponível.');
  fireEvent.change(within(dialog).getByLabelText('Tipo de despesa'), { target: { value: 'geral' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));
  await screen.findByText('Alterações salvas.'); expect(atualizar).toHaveBeenCalledWith(item.id, expect.objectContaining({ viagemId: null }));
});

it('nao cadastra despesa de viagem sem selecionar o vinculo', async () => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([]); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  const cadastrar = vi.spyOn(despesasApi, 'cadastrar').mockResolvedValue(item);
  render(<DespesasPage />); fireEvent.click(screen.getByRole('button', { name: 'Cadastrar despesa' }));
  const dialog = screen.getByRole('dialog'); preencher(dialog);
  fireEvent.change(within(dialog).getByLabelText('Tipo de despesa'), { target: { value: 'viagem' } });
  await waitFor(() => expect((within(dialog).getByRole('button', { name: 'Cadastrar despesa' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.submit(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }).closest('form')!);
  await within(dialog).findByText('Selecione a viagem desta despesa.'); expect(cadastrar).not.toHaveBeenCalled();
});
function preencher(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText('Descrição (obrigatório)'), { target: { value: item.descricao } });
  fireEvent.change(within(dialog).getByLabelText('Categoria (obrigatório)'), { target: { value: item.categoria } });
  fireEvent.change(within(dialog).getByLabelText('Data da despesa (obrigatório)'), { target: { value: item.dataDespesa } });
  fireEvent.change(within(dialog).getByLabelText('Valor (obrigatório)'), { target: { value: '12,50' } });
}

it('atalho abre despesa com viagem cancelada selecionada e exige inclusao financeira explicita', async () => {
  const viagem: Viagem = { id: 'viagem-atalho', origem: 'Origem selecionada', destino: 'Destino selecionado', dataViagem: '2030-01-02', status: 'Cancelada',
    motoristaId: null, motoristaNome: null, motoristaAtivo: null, caminhaoId: null, caminhaoPlaca: null, caminhaoAtivo: null, valorFrete: null, dataCadastro: '' };
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(viagem); vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]);
  const cadastrar = vi.spyOn(despesasApi, 'cadastrar').mockResolvedValue(item);
  window.history.replaceState(null, '', '#/despesas?viagemId=viagem-atalho');
  try {
    render(<DespesasPage />); const dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('option', { name: /Origem selecionada/ });
    expect((within(dialog).getByLabelText('Viagem (obrigatório)') as HTMLSelectElement).value).toBe(viagem.id);
    expect((within(dialog).getByLabelText('Incluir no financeiro (obrigatório)') as HTMLSelectElement).value).toBe('');
    expect(cadastrar).not.toHaveBeenCalled(); preencher(dialog);
    fireEvent.change(within(dialog).getByLabelText('Incluir no financeiro (obrigatório)'), { target: { value: 'nao' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }));
    await screen.findByText('Despesa cadastrada.');
    expect(cadastrar).toHaveBeenCalledWith(expect.objectContaining({ viagemId: viagem.id, considerarNoFinanceiro: false }));
  } finally { window.history.replaceState(null, '', '/'); }
});

it('atalho para viagem inexistente informa falha sem abrir cadastro generico', async () => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([]); vi.spyOn(viagensApi, 'obter').mockRejectedValue(new Error('Viagem não encontrada.'));
  window.history.replaceState(null, '', '#/despesas?viagemId=inexistente');
  try { render(<DespesasPage />); await screen.findByText('Viagem não encontrada.'); expect(screen.queryByRole('dialog')).toBeNull(); }
  finally { window.history.replaceState(null, '', '/'); }
});

it('preserva despesa desconsiderada no historico e permite reinclusao explicita', async () => {
  const desconsiderada = { ...item, considerarNoFinanceiro: false };
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([desconsiderada]); vi.spyOn(despesasApi, 'obter').mockResolvedValue(desconsiderada);
  const atualizar = vi.spyOn(despesasApi, 'atualizar').mockResolvedValue();
  render(<DespesasPage />); await screen.findByText('Desconsiderada no financeiro');
  expect(screen.getByText(/Total deste filtro/).textContent).toMatch(/R\$\s*0,00/);
  fireEvent.click(screen.getByRole('button', { name: 'Editar despesa Lançamento de teste' }));
  const dialog = await screen.findByRole('dialog');
  expect((within(dialog).getByLabelText('Incluir no financeiro (obrigatório)') as HTMLSelectElement).value).toBe('nao');
  fireEvent.change(within(dialog).getByLabelText('Incluir no financeiro (obrigatório)'), { target: { value: 'sim' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' })); await screen.findByText('Alterações salvas.');
  expect(atualizar).toHaveBeenCalledWith(item.id, expect.objectContaining({ considerarNoFinanceiro: true }));
});
it('cadastra com data civil, valor decimal e sem vinculo', async () => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([]); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  const cadastrar = vi.spyOn(despesasApi, 'cadastrar').mockResolvedValue(item);
  render(<DespesasPage />); fireEvent.click(screen.getByRole('button', { name: 'Cadastrar despesa' }));
  const dialog = screen.getByRole('dialog'); preencher(dialog);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }));
  await screen.findByText('Despesa cadastrada.');
  expect(cadastrar).toHaveBeenCalledWith({ descricao: item.descricao, categoria: item.categoria, dataDespesa: item.dataDespesa, valor: 12.5, viagemId: null, caminhaoId: null });
});
it('filtra periodo e busca localmente, preservando despesas de viagens canceladas', async () => {
  const listar = vi.spyOn(despesasApi, 'listar').mockResolvedValue([item, { ...item, id: 'outra', descricao: 'Outra despesa', viagemId: 'viagem', viagem: { origem: 'Origem teste', destino: 'Destino teste', status: 'Cancelada' } }]);
  render(<DespesasPage />); await screen.findByText('Lançamento de teste');
  fireEvent.change(screen.getByLabelText('Buscar descrição, categoria ou percurso'), { target: { value: 'origem' } });
  expect(screen.getByText('Outra despesa')).toBeTruthy(); expect(screen.queryByText('Lançamento de teste')).toBeNull();
  expect(screen.getByText('Cancelada')).toBeTruthy(); expect(listar).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2030-01-03' } });
  await screen.findByText(/Nenhuma despesa encontrada/);
});
it('exige confirmacao para excluir e permite cancelar', async () => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([item]); vi.spyOn(despesasApi, 'obter').mockResolvedValue(item);
  const excluir = vi.spyOn(despesasApi, 'excluir').mockResolvedValue(); render(<DespesasPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir despesa Lançamento de teste' }));
  let dialog = await screen.findByRole('dialog'); expect(excluir).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' })); expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Excluir despesa Lançamento de teste' })); dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir despesa' })); await screen.findByText('Despesa excluída.'); expect(excluir).toHaveBeenCalledWith(item.id);
});
it('edita e preserva os valores quando ha conflito', async () => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([item]); vi.spyOn(despesasApi, 'obter').mockResolvedValue(item); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  const atualizar = vi.spyOn(despesasApi, 'atualizar').mockRejectedValue(new HttpError(409, 'Dados alterados por outra operação.'));
  render(<DespesasPage />); fireEvent.click(await screen.findByRole('button', { name: 'Editar despesa Lançamento de teste' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Descrição (obrigatório)'), { target: { value: 'Preservado' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' })); await within(dialog).findByText('Dados alterados por outra operação.');
  expect((within(dialog).getByLabelText('Descrição (obrigatório)') as HTMLInputElement).value).toBe('Preservado');
  expect(atualizar).toHaveBeenCalledWith(item.id, expect.objectContaining({ descricao: 'Preservado', dataDespesa: '2030-01-02' }));
});
it('recupera falha de consulta sem apresentar total inventado', async () => {
  const listar = vi.spyOn(despesasApi, 'listar').mockRejectedValueOnce(new Error('Sem conexão.')).mockResolvedValue([]);
  render(<DespesasPage />); await screen.findByText('Sem conexão.'); expect(screen.queryByText(/Total deste filtro/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar lista' })); await screen.findByText(/Nenhuma despesa encontrada/); await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
});
it.each(['Planejada', 'Em andamento', 'Concluída', 'Cancelada'])('permite vincular despesa a viagem %s', async status => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([]);
  const viagem: Viagem = { id: 'viagem-teste', origem: 'Origem teste', destino: 'Destino teste', dataViagem: '2030-01-02', status,
    motoristaId: null, motoristaNome: null, motoristaAtivo: null, caminhaoId: null, caminhaoPlaca: null, caminhaoAtivo: null, valorFrete: null, dataCadastro: '' };
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]);
  const cadastrar = vi.spyOn(despesasApi, 'cadastrar').mockResolvedValue(item);
  render(<DespesasPage />); fireEvent.click(screen.getByRole('button', { name: 'Cadastrar despesa' }));
  const dialog = screen.getByRole('dialog'); preencher(dialog);
  fireEvent.change(within(dialog).getByLabelText('Tipo de despesa'), { target: { value: 'viagem' } });
  await within(dialog).findByRole('option', { name: new RegExp(status) });
  fireEvent.change(within(dialog).getByLabelText('Viagem (obrigatório)'), { target: { value: 'viagem-teste' } });
  if (status === 'Cancelada') fireEvent.change(within(dialog).getByLabelText('Incluir no financeiro (obrigatório)'), { target: { value: 'sim' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }));
  await screen.findByText('Despesa cadastrada.'); expect(cadastrar).toHaveBeenCalledWith(expect.objectContaining({ viagemId: 'viagem-teste' }));
});
