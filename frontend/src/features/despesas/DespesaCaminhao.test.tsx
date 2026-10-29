import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { DespesaForm } from './DespesaForm';
import { caminhoesApi } from '../caminhoes/caminhoesApi';
import { viagensApi } from '../viagens/viagensApi';
import { despesasApi } from './despesasApi';
import { DespesasPage } from '../../pages/DespesasPage';
import type { Despesa } from './types';

const caminhao = { id: 'c1', placa: 'ABC1234', modelo: 'Modelo teste', ativo: true, dataCadastro: '' };
const despesa: Despesa = { id: 'd1', descricao: 'Oficina', categoria: 'Manutenção', valor: 100, dataDespesa: '2030-01-02', dataCadastro: '', viagemId: null, viagem: null, caminhaoId: 'c1', caminhao };

it('envia vinculo opcional e limpa caminhao ao converter para viagem', async () => {
  vi.spyOn(caminhoesApi, 'listar').mockResolvedValue([caminhao]);
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ id: 'v1', origem: 'A', destino: 'B', status: 'Planejada',
    dataViagem: '2030-01-02', dataCadastro: '', valorFrete: null, motoristaId: null, motoristaNome: null,
    motoristaAtivo: null, caminhaoId: null, caminhaoPlaca: null, caminhaoAtivo: null }]);
  const save = vi.fn().mockResolvedValue(undefined);
  render(<DespesaForm despesa={despesa} busy={false} onSave={save} />);
  await screen.findByRole('option', { name: /ABC1234.*Modelo teste/ });
  fireEvent.submit(screen.getByRole('button', { name: 'Salvar alterações' }).closest('form')!);
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ caminhaoId: 'c1', viagemId: null })));
  fireEvent.change(screen.getByLabelText('Tipo de despesa'), { target: { value: 'viagem' } });
  await screen.findByRole('option', { name: /A → B/ });
  fireEvent.change(screen.getByLabelText('Viagem (obrigatório)'), { target: { value: 'v1' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Salvar alterações' }).closest('form')!);
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ caminhaoId: null, viagemId: 'v1' })));
});

it('preserva o inativo atual, oculta outros e permite remover o vinculo', async () => {
  vi.spyOn(caminhoesApi, 'listar').mockResolvedValue([{ ...caminhao, ativo: false }, { ...caminhao, id: 'c2', placa: 'DEF1234', ativo: false }]);
  const save = vi.fn().mockResolvedValue(undefined);
  render(<DespesaForm despesa={despesa} busy={false} onSave={save} />);
  await screen.findByRole('option', { name: /ABC1234.*inativo/ });
  expect(screen.queryByRole('option', { name: /DEF1234/ })).toBeNull();
  fireEvent.change(screen.getByLabelText('Caminhão (opcional)'), { target: { value: '' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Salvar alterações' }).closest('form')!);
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ caminhaoId: null })));
});

it('filtra despesas gerais por caminhao sem duplicar o total', async () => {
  vi.spyOn(despesasApi, 'listar').mockResolvedValue([despesa, { ...despesa, id: 'd2', descricao: 'Escritório', valor: 30, caminhaoId: null, caminhao: null }]);
  render(<DespesasPage />); await screen.findByText('Oficina');
  fireEvent.change(screen.getByLabelText('Caminhão da despesa geral'), { target: { value: 'c1' } });
  expect(screen.queryByText('Escritório')).toBeNull(); expect(screen.getByText(/ABC1234 · Modelo teste/, { selector: 'span' })).toBeTruthy();
  expect(screen.getAllByText('R$ 100,00')).toHaveLength(2);
});
