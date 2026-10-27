import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MotoristaPerfilPage } from '../../pages/MotoristaPerfilPage';
import { motoristasApi } from './motoristasApi';
import { viagensApi } from '../viagens/viagensApi';
import { despesasApi } from '../despesas/despesasApi';
import type { Motorista } from './types';
import type { Viagem } from '../viagens/types';
import type { Despesa } from '../despesas/types';

const motorista: Motorista = { id: 'm1', nome: 'Marina Teste', telefone: null, cpf: null, numeroCnh: null,
  categoriaCnh: 'E', dataValidadeCnh: '2030-01-02', ativo: false, dataCadastro: '2026-10-01T00:00:00Z' };
const viagem: Viagem = { id: 'v1', motoristaId: 'm1', motoristaNome: motorista.nome, motoristaAtivo: false,
  caminhaoId: 'c1', caminhaoPlaca: 'ABC1D23', caminhaoAtivo: true, origem: 'Curitiba', destino: 'Santos',
  dataViagem: '2026-10-15', valorFrete: 1500.5, status: 'Concluída', dataCadastro: '2026-10-01T00:00:00Z' };
const despesa: Despesa = { id: 'd1', viagemId: 'v1', origem: 'RemuneracaoMotorista', considerarNoFinanceiro: true,
  descricao: 'Remuneração', categoria: 'Motorista', valor: 225.08, dataDespesa: '2026-10-15', dataCadastro: '2026-10-01T00:00:00Z', viagem: null };

beforeEach(() => {
  window.history.replaceState(null, '', '#/motoristas?motoristaId=m1');
  vi.spyOn(motoristasApi, 'obter').mockResolvedValue(motorista);
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem, { ...viagem, id: 'outra', motoristaId: 'm2', origem: 'Percurso alheio' }]);
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([despesa]);
});

it('abre o cadastro de inativo com campos ausentes e consulta viagens somente quando necessario', async () => {
  const { rerender } = render(<MotoristaPerfilPage motoristaId="m1" />);
  await screen.findByRole('region', { name: 'Dados cadastrais' });
  expect(screen.getByText('Inativo')).toBeTruthy();
  expect(screen.getByText('02/01/2030')).toBeTruthy();
  expect(viagensApi.listar).not.toHaveBeenCalled(); expect(despesasApi.listar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Viagens' }));
  expect(window.location.hash).toBe('#/motoristas?motoristaId=m1&aba=viagens');
  rerender(<MotoristaPerfilPage motoristaId="m1" aba="viagens" />);
  await screen.findByRole('heading', { name: 'Curitiba → Santos' });
  expect(screen.queryByText(/Percurso alheio/)).toBeNull();
  expect(despesasApi.listar).not.toHaveBeenCalled();
});

it('filtra por situacao e periodo sem novas consultas e mostra detalhes da viagem', async () => {
  render(<MotoristaPerfilPage motoristaId="m1" aba="viagens" />);
  await screen.findByRole('heading', { name: 'Curitiba → Santos' });
  fireEvent.click(screen.getByRole('button', { name: 'Ver viagem Curitiba para Santos' }));
  const dialog = screen.getByRole('dialog'); expect(within(dialog).getByText('ABC1D23')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
  fireEvent.change(screen.getByLabelText('Situação da viagem'), { target: { value: 'Pausada' } });
  expect(screen.getByText('Nenhuma viagem encontrada para este motorista.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-10-16' } });
  expect(screen.getByText('Nenhuma viagem encontrada para este motorista.')).toBeTruthy();
  expect(viagensApi.listar).toHaveBeenCalledTimes(1);
});

it('separa valores previstos e historicos usando somente lancamentos automaticos vinculados', async () => {
  vi.mocked(despesasApi.listar).mockResolvedValue([despesa,
    { ...despesa, id: 'excluida', considerarNoFinanceiro: false, valor: 10.02 },
    { ...despesa, id: 'manual', origem: 'Manual', valor: 900 },
    { ...despesa, id: 'outro-motorista', viagemId: 'outra', valor: 800 }]);
  render(<MotoristaPerfilPage motoristaId="m1" aba="remuneracao" />);
  const region = await screen.findByRole('region', { name: 'Lançamentos de remuneração' });
  expect(within(region).getAllByRole('row')).toHaveLength(3);
  expect(screen.queryByText(/900,00|800,00/)).toBeNull();
  expect(within(region).getByText('Somente histórico')).toBeTruthy();
  expect(within(region).getByText('Incluída')).toBeTruthy();
  expect(screen.getByText(/Não representam pagamentos realizados/)).toBeTruthy();
  expect(screen.getByText(/Não há histórico separado de beneficiários/)).toBeTruthy();
  expect(screen.getAllByText(/225,08/)).toHaveLength(2); expect(screen.getAllByText(/10,02/)).toHaveLength(2);
});

it('mantem totais indisponiveis ate concluir despesas e permite recuperar falha', async () => {
  vi.mocked(despesasApi.listar).mockRejectedValueOnce(new Error('Falha nas despesas.')).mockResolvedValue([despesa]);
  render(<MotoristaPerfilPage motoristaId="m1" aba="remuneracao" />);
  await screen.findByText('Falha nas despesas.');
  expect(screen.queryByText('Remuneração prevista')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Recarregar remuneração' }));
  await screen.findByText('Remuneração prevista');
  expect(despesasApi.listar).toHaveBeenCalledTimes(2);
});

it('nao apresenta valores nem zero enquanto a remuneracao ainda esta carregando', async () => {
  let concluir!: (despesas: Despesa[]) => void;
  const resposta = new Promise<Despesa[]>(resolve => { concluir = resolve; });
  vi.mocked(despesasApi.listar).mockReturnValue(resposta);
  render(<MotoristaPerfilPage motoristaId="m1" aba="remuneracao" />);
  await screen.findByText('Carregando remuneração do motorista…');
  expect(screen.queryByText('Remuneração prevista')).toBeNull(); expect(screen.queryByText(/R\$/)).toBeNull();
  await act(async () => { concluir([despesa]); await resposta; });
  await screen.findByText('Remuneração prevista');
});

it('bloqueia periodo invertido sem exibir totais enganosos e inclui o dia limite', async () => {
  render(<MotoristaPerfilPage motoristaId="m1" aba="remuneracao" />);
  await screen.findByText('Remuneração prevista');
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-10-16' } });
  fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-10-15' } });
  expect(screen.getByRole('alert').textContent).toContain('A data inicial está depois da data final');
  expect(screen.queryByText('Remuneração prevista')).toBeNull();
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-10-15' } });
  expect(screen.getByRole('region', { name: 'Lançamentos de remuneração' })).toBeTruthy();
  expect(despesasApi.listar).toHaveBeenCalledTimes(1);
});

it('exibe vazio sem criar remuneracao retroativa e explica valores desconhecidos', async () => {
  vi.mocked(despesasApi.listar).mockResolvedValue([]);
  const { unmount } = render(<MotoristaPerfilPage motoristaId="m1" aba="remuneracao" />);
  await screen.findByText('Nenhum lançamento automático neste período.');
  expect(screen.getByText(/Viagens antigas não geram remuneração retroativa/)).toBeTruthy();
  unmount();
  vi.mocked(despesasApi.listar).mockResolvedValue([{ ...despesa, valor: null }]);
  render(<MotoristaPerfilPage motoristaId="m1" aba="remuneracao" />);
  await screen.findByRole('alert');
  expect(screen.getByRole('alert').textContent).toContain('Há lançamentos sem valor válido');
});

it('mantem cadastro consultavel se viagens falham e nao aceita dados de perfil inexistente', async () => {
  vi.mocked(viagensApi.listar).mockRejectedValue(new Error('Falha nas viagens.'));
  const { rerender, unmount } = render(<MotoristaPerfilPage motoristaId="m1" aba="viagens" />);
  await screen.findByText('Falha nas viagens.');
  rerender(<MotoristaPerfilPage motoristaId="m1" />);
  expect(screen.getByRole('region', { name: 'Dados cadastrais' })).toBeTruthy();
  unmount();
  vi.mocked(motoristasApi.obter).mockRejectedValue(new Error('Motorista não encontrado.'));
  render(<MotoristaPerfilPage motoristaId="inexistente" aba="remuneracao" />);
  await screen.findByText('Motorista não encontrado.');
  expect(screen.queryByText('Remuneração prevista')).toBeNull();
});

it('edita cadastro no perfil preservando situacao e recupera erro sem perder formulario', async () => {
  const atualizar = vi.spyOn(motoristasApi, 'atualizar').mockRejectedValueOnce(new Error('Conflito de edição.')).mockResolvedValue();
  render(<MotoristaPerfilPage motoristaId="m1" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Editar cadastro' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Nome (obrigatório)'), { target: { value: 'Nome alterado' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));
  await within(dialog).findByText('Conflito de edição.');
  expect((within(dialog).getByLabelText('Nome (obrigatório)') as HTMLInputElement).value).toBe('Nome alterado');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));
  await screen.findByText('Cadastro do motorista atualizado.');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(atualizar).toHaveBeenLastCalledWith('m1', expect.objectContaining({ nome: 'Nome alterado', ativo: false, dataValidadeCnh: '2030-01-02' }));
});
