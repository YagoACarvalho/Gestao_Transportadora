import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ViagensPage } from '../../pages/ViagensPage';
import { viagensApi } from './viagensApi';
import { motoristasApi } from '../motoristas/motoristasApi';
import { caminhoesApi } from '../caminhoes/caminhoesApi';
import { HttpError } from '../../api/http';
import type { Viagem } from './types';

const viagem: Viagem = { id: 'viagem', origem: 'Origem teste', destino: 'Destino teste', dataViagem: '2030-01-02', motoristaId: 'motorista', motoristaNome: 'Motorista teste', motoristaAtivo: true, caminhaoId: 'caminhao', caminhaoPlaca: 'TESTE01', caminhaoAtivo: true, valorFrete: 100.5, status: 'Planejada', dataCadastro: '2026-01-01T00:00:00Z' };
function vinculos() {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([{ id: 'motorista', nome: 'Motorista teste', ativo: true, cpf: null, numeroCnh: null, categoriaCnh: null, dataValidadeCnh: null, telefone: null, dataCadastro: '2026-01-01T00:00:00Z' }]);
  vi.spyOn(caminhoesApi, 'listar').mockResolvedValue([{ id: 'caminhao', placa: 'TESTE01', modelo: 'Modelo teste', ativo: true, dataCadastro: '2026-01-01T00:00:00Z' }]);
}
async function cadastro() {
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar viagem' }));
  const dialog = screen.getByRole('dialog');
  await within(dialog).findByRole('option', { name: 'Motorista teste' });
  fireEvent.change(within(dialog).getByLabelText('Origem (obrigatório)'), { target: { value: 'Origem teste' } });
  fireEvent.change(within(dialog).getByLabelText('Destino (obrigatório)'), { target: { value: 'Destino teste' } });
  fireEvent.change(within(dialog).getByLabelText('Data da viagem (obrigatório)'), { target: { value: '2030-01-02' } });
  fireEvent.change(within(dialog).getByLabelText('Motorista (obrigatório)'), { target: { value: 'motorista' } });
  fireEvent.change(within(dialog).getByLabelText('Caminhão (obrigatório)'), { target: { value: 'caminhao' } });
  return dialog;
}
it('filtra viagens localmente por situacao e periodo', async () => {
  const listar = vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem, { ...viagem, id: 'outra', origem: 'Outra origem', status: 'Cancelada', dataViagem: '2030-01-03' }]);
  render(<ViagensPage />); await screen.findByText('Origem teste');
  fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'Planejada' } });
  expect(screen.queryByText('Outra origem')).toBeNull();
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2030-01-03' } });
  expect(screen.getByText('Nenhuma viagem encontrada neste filtro.')).toBeTruthy();
  expect(listar).toHaveBeenCalledTimes(1);
});
it('cadastra com vinculos ativos e frete decimal, sem controlar status inicial', async () => {
  vinculos(); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  const cadastrar = vi.spyOn(viagensApi, 'cadastrar').mockResolvedValue(viagem);
  render(<ViagensPage />); const dialog = await cadastro();
  fireEvent.change(within(dialog).getByLabelText('Valor do frete (opcional)'), { target: { value: '1500,50' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar viagem' }));
  await screen.findByText('Viagem cadastrada como planejada.');
  expect(cadastrar).toHaveBeenCalledWith({ origem: 'Origem teste', destino: 'Destino teste', dataViagem: '2030-01-02', motoristaId: 'motorista', caminhaoId: 'caminhao', valorFrete: 1500.5 });
  expect(motoristasApi.listar).toHaveBeenCalledWith(false, expect.any(AbortSignal));
});
it('edita planejada mantendo vinculos atuais desativados', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ ...viagem, motoristaAtivo: false, caminhaoAtivo: false }]);
  vi.spyOn(viagensApi, 'obter').mockResolvedValue({ ...viagem, motoristaAtivo: false, caminhaoAtivo: false });
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([]); vi.spyOn(caminhoesApi, 'listar').mockResolvedValue([]);
  const atualizar = vi.spyOn(viagensApi, 'atualizar').mockResolvedValue(); render(<ViagensPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Editar viagem Origem teste' }));
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByRole('option', { name: 'Motorista teste (mantido do cadastro)' });
  fireEvent.change(within(dialog).getByLabelText('Destino (obrigatório)'), { target: { value: 'Editado' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));
  await screen.findByText('Alterações salvas.');
  expect(atualizar).toHaveBeenCalledWith('viagem', expect.objectContaining({ destino: 'Editado', status: 'Planejada', motoristaId: 'motorista', caminhaoId: 'caminhao', dataViagem: '2030-01-02' }));
});
it('exige confirmacao para iniciar e permite desistir antes do envio', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(viagem);
  const atualizar = vi.spyOn(viagensApi, 'atualizar').mockResolvedValue(); render(<ViagensPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Iniciar viagem Origem teste' }));
  const dialog = await screen.findByRole('dialog'); expect(atualizar).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar' })); expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar viagem Origem teste' }));
  const confirm = await screen.findByRole('dialog'); fireEvent.click(within(confirm).getByRole('button', { name: 'Confirmar alteração' }));
  await screen.findByText('Situação da viagem alterada para em andamento.');
  expect(atualizar).toHaveBeenCalledWith('viagem', expect.objectContaining({ status: 'Em andamento', valorFrete: 100.5 }));
});
it('nao oferece edicao ou cancelamento de concluida e apresenta legado nulo', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ ...viagem, status: 'Concluída' }, { ...viagem, id: 'legado', origem: null, destino: null, dataViagem: null, motoristaId: null, motoristaNome: null, caminhaoId: null, caminhaoPlaca: null, valorFrete: null, status: null }]);
  render(<ViagensPage />); await screen.findByText('Origem teste');
  expect(screen.queryByRole('button', { name: /Editar viagem/ })).toBeNull(); expect(screen.queryByRole('button', { name: /Cancelar viagem/ })).toBeNull();
  expect(screen.getByText('Origem não informada')).toBeTruthy(); expect(screen.getByText('Dados incompletos')).toBeTruthy();
});
it('preserva formulario e mostra validacao do backend', async () => {
  vinculos(); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  vi.spyOn(viagensApi, 'cadastrar').mockRejectedValue(new HttpError(400, 'Revise os campos informados.', { MotoristaId: ['Motorista desativado durante o cadastro.'] }));
  render(<ViagensPage />); const dialog = await cadastro();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar viagem' }));
  await within(dialog).findByText('Motorista desativado durante o cadastro.');
  expect((within(dialog).getByLabelText('Origem (obrigatório)') as HTMLInputElement).value).toBe('Origem teste');
});
it('recusa frete invalido sem enviar e mantem os valores', async () => {
  vinculos(); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]);
  const cadastrar = vi.spyOn(viagensApi, 'cadastrar').mockResolvedValue(viagem); render(<ViagensPage />); const dialog = await cadastro();
  fireEvent.change(within(dialog).getByLabelText('Valor do frete (opcional)'), { target: { value: '1,001' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar viagem' }));
  await within(dialog).findByText('Informe frete não negativo, com até duas casas decimais.');
  expect(cadastrar).not.toHaveBeenCalled();
});
it('recupera consulta e informa falta de vinculos ativos', async () => {
  vi.spyOn(viagensApi, 'listar').mockRejectedValueOnce(new Error('Sem conexão.')).mockResolvedValue([]);
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([]); vi.spyOn(caminhoesApi, 'listar').mockResolvedValue([]);
  render(<ViagensPage />); await screen.findByText('Sem conexão.'); fireEvent.click(screen.getByRole('button', { name: 'Atualizar lista' }));
  await screen.findByText('Nenhuma viagem encontrada neste filtro.'); fireEvent.click(screen.getByRole('button', { name: 'Cadastrar viagem' }));
  await screen.findByText('Nenhum motorista ativo disponível. Cadastre um motorista antes de criar a viagem.');
});
it('bloqueia edicao quando o status consultado ja mudou', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]); vi.spyOn(viagensApi, 'obter').mockResolvedValue({ ...viagem, status: 'Em andamento' });
  render(<ViagensPage />); fireEvent.click(await screen.findByRole('button', { name: 'Editar viagem Origem teste' }));
  await screen.findByText('A situação desta viagem mudou. Atualize a lista antes de continuar.'); expect(screen.queryByRole('dialog')).toBeNull();
});
