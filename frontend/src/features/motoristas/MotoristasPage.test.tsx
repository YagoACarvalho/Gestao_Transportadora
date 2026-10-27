import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { MotoristasPage } from '../../pages/MotoristasPage';
import { motoristasApi } from './motoristasApi';
import type { Motorista } from './types';
const item: Motorista = { id: 'teste', nome: 'Motorista de teste', ativo: true, cpf: null, numeroCnh: null, categoriaCnh: null, dataValidadeCnh: '2030-01-02', telefone: null, dataCadastro: '2026-01-01T00:00:00Z' };

it('reativa somente apos confirmar e preserva os dados lidos pelo GET', async () => {
  const inativo = { ...item, ativo: false, telefone: '11999999999' };
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([inativo]);
  const obter = vi.spyOn(motoristasApi, 'obter').mockResolvedValue(inativo);
  const atualizar = vi.spyOn(motoristasApi, 'atualizar').mockResolvedValue();
  render(<MotoristasPage />); fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'inativos' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Reativar Motorista de teste' }));
  let dialog = await screen.findByRole('dialog'); expect(atualizar).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar' })); expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reativar Motorista de teste' })); dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Reativar motorista' }));
  await screen.findByText('Motorista reativado.'); expect(obter).toHaveBeenCalledWith(item.id);
  expect(atualizar).toHaveBeenCalledWith(item.id, { nome: item.nome, cpf: null, numeroCnh: null, categoriaCnh: null, dataValidadeCnh: item.dataValidadeCnh, telefone: '11999999999', ativo: true });
});
it('lista, busca e filtra inativos sem chamadas por digitacao', async () => {
  const listar = vi.spyOn(motoristasApi, 'listar').mockResolvedValue([item, { ...item, id: 'inativo', nome: 'Inativo teste', ativo: false }]);
  render(<MotoristasPage />);
  await screen.findByText('Motorista de teste');
  fireEvent.change(screen.getByLabelText('Buscar por nome, CPF ou CNH'), { target: { value: 'ausente' } });
  expect(screen.getByText('Nenhum resultado para esta busca.')).toBeTruthy();
  expect(listar).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Buscar por nome, CPF ou CNH'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'inativos' } });
  await screen.findByText('Inativo teste');
  expect(listar).toHaveBeenLastCalledWith(true, expect.any(AbortSignal));
});
it('cadastra e envia campos opcionais vazios como null', async () => {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([]);
  const cadastrar = vi.spyOn(motoristasApi, 'cadastrar').mockResolvedValue(item);
  render(<MotoristasPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar motorista' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Nome (obrigatório)'), { target: { value: 'Teste novo' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar motorista' }));
  await screen.findByText('Motorista cadastrado como ativo.');
  expect(cadastrar).toHaveBeenCalledWith({ nome: 'Teste novo', cpf: null, numeroCnh: null, categoriaCnh: null, dataValidadeCnh: null, telefone: null });
});
it('preserva Ativo e data na edicao de inativo', async () => {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([{ ...item, ativo: false }]);
  vi.spyOn(motoristasApi, 'obter').mockResolvedValue({ ...item, ativo: false });
  const atualizar = vi.spyOn(motoristasApi, 'atualizar').mockResolvedValue();
  render(<MotoristasPage />);
  fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'inativos' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Motorista de teste' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Nome (obrigatório)'), { target: { value: 'Nome editado' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));
  await screen.findByText('Alterações salvas.');
  expect(atualizar).toHaveBeenCalledWith('teste', expect.objectContaining({ nome: 'Nome editado', ativo: false, dataValidadeCnh: '2030-01-02' }));
});
it('so desativa apos confirmacao e permite cancelar', async () => {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([item]);
  vi.spyOn(motoristasApi, 'obter').mockResolvedValue(item);
  const desativar = vi.spyOn(motoristasApi, 'desativar').mockResolvedValue();
  render(<MotoristasPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Desativar Motorista de teste' }));
  expect(desativar).not.toHaveBeenCalled();
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Desativar Motorista de teste' }));
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Desativar motorista' }));
  await screen.findByText('Motorista desativado.');
  expect(desativar).toHaveBeenCalledTimes(1);
});
it('mantem formulario e valores quando o envio falha', async () => {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([]);
  vi.spyOn(motoristasApi, 'cadastrar').mockRejectedValue(new Error('Falha de envio.'));
  render(<MotoristasPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar motorista' }));
  const dialog = screen.getByRole('dialog');
  const nome = within(dialog).getByLabelText('Nome (obrigatório)') as HTMLInputElement;
  fireEvent.change(nome, { target: { value: 'Preservado' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar motorista' }));
  await within(dialog).findByText('Falha de envio.');
  expect(nome.value).toBe('Preservado');
});
it('permite recuperar falha de consulta', async () => {
  const listar = vi.spyOn(motoristasApi, 'listar').mockRejectedValueOnce(new Error('Sem conexão.')).mockResolvedValue([]);
  render(<MotoristasPage />);
  await screen.findByText('Sem conexão.');
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar lista' }));
  await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
  await screen.findByText('Nenhum motorista encontrado neste filtro.');
});
it('reativa somente quando a situacao e marcada explicitamente', async () => {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([{ ...item, ativo: false }]);
  vi.spyOn(motoristasApi, 'obter').mockResolvedValue({ ...item, ativo: false });
  const atualizar = vi.spyOn(motoristasApi, 'atualizar').mockResolvedValue();
  render(<MotoristasPage />); fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'inativos' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Motorista de teste' }));
  const dialog = await screen.findByRole('dialog'); fireEvent.click(within(dialog).getByLabelText('Cadastro ativo'));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));
  await screen.findByText('Alterações salvas.'); expect(atualizar).toHaveBeenCalledWith(item.id, expect.objectContaining({ ativo: true }));
});

it('apresenta cadastros em cards com links para perfil e viagens sem consultas por motorista', async () => {
  vi.spyOn(motoristasApi, 'listar').mockResolvedValue([{ ...item, id: 'id/com espaço' }]);
  const obter = vi.spyOn(motoristasApi, 'obter');
  render(<MotoristasPage />);
  const card = await screen.findByRole('region', { name: item.nome });
  expect(within(card).getByRole('heading', { name: item.nome })).toBeTruthy();
  expect(within(card).getByRole('link', { name: `Ver perfil de ${item.nome}` }).getAttribute('href')).toBe('#/motoristas?motoristaId=id%2Fcom%20espa%C3%A7o');
  expect(within(card).getByRole('link', { name: `Ver viagens de ${item.nome}` }).getAttribute('href')).toBe('#/motoristas?motoristaId=id%2Fcom%20espa%C3%A7o&aba=viagens');
  expect(obter).not.toHaveBeenCalled(); expect(screen.queryByRole('table')).toBeNull();
});
