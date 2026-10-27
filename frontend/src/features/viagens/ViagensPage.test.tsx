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

it('mostra previa de 15% e nao apresenta valor quando o frete e invalido', async () => {
  vinculos(); vi.spyOn(viagensApi, 'listar').mockResolvedValue([]); render(<ViagensPage />);
  const dialog = await cadastro();
  fireEvent.change(within(dialog).getByLabelText('Valor do frete (opcional)'), { target: { value: '1500,50' } });
  expect(within(dialog).getByText(/R\$\s*225,08/)).toBeTruthy();
  expect(within(dialog).getByText(/não confirma pagamento/)).toBeTruthy();
  fireEvent.change(within(dialog).getByLabelText('Valor do frete (opcional)'), { target: { value: 'abc' } });
  expect(within(dialog).queryByText(/R\$\s*225,08/)).toBeNull();
  expect(within(dialog).getByText('Informe um frete válido')).toBeTruthy();
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
it.each([
  ['Em andamento', 'Pausar', 'Pausada'],
  ['Pausada', 'Retomar', 'Em andamento'],
])('confirma %s para %s mantendo dados e frete', async (atual, acao, proxima) => {
  const atualizada = { ...viagem, status: atual };
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([atualizada]);
  vi.spyOn(viagensApi, 'obter').mockResolvedValue(atualizada);
  const atualizar = vi.spyOn(viagensApi, 'atualizar').mockResolvedValue();
  render(<ViagensPage />);
  fireEvent.click(await screen.findByRole('button', { name: `${acao} viagem Origem teste` }));
  const dialog = await screen.findByRole('dialog');
  expect(atualizar).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar alteração' }));
  await screen.findByText(`Situação da viagem alterada para ${proxima.toLocaleLowerCase('pt-BR')}.`);
  expect(atualizar).toHaveBeenCalledWith('viagem', { origem: viagem.origem, destino: viagem.destino, dataViagem: viagem.dataViagem, motoristaId: viagem.motoristaId, caminhaoId: viagem.caminhaoId, valorFrete: viagem.valorFrete, status: proxima });
});

it('filtra pausadas e oferece retomada sem edicao ou conclusao direta', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ ...viagem, status: 'Pausada' }, { ...viagem, id: 'outra', origem: 'Outra origem' }]);
  render(<ViagensPage />); await screen.findByText('Origem teste');
  fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'Pausada' } });
  expect(screen.queryByText('Outra origem')).toBeNull();
  expect(screen.getByRole('button', { name: 'Retomar viagem Origem teste' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cancelar viagem Origem teste' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Concluir viagem|Editar viagem|Pausar viagem/ })).toBeNull();
});

it('mostra as acoes de andamento junto do percurso na primeira coluna', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ ...viagem, status: 'Em andamento' }]);
  render(<ViagensPage />);
  const percurso = (await screen.findByText('Origem teste')).closest('th')!;
  expect(within(percurso).getByRole('button', { name: 'Pausar viagem Origem teste' })).toBeTruthy();
  expect(within(percurso).getByRole('button', { name: 'Concluir viagem Origem teste' })).toBeTruthy();
  expect(within(percurso).getByRole('button', { name: 'Cancelar viagem Origem teste' })).toBeTruthy();
});

it('explica dados incompletos mantendo a acao de inicio visivel e bloqueada', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ ...viagem, motoristaId: null }]);
  render(<ViagensPage />);
  const iniciar = await screen.findByRole('button', { name: 'Iniciar viagem Origem teste' });
  expect((iniciar as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Complete os dados obrigatórios para iniciar, pausar, retomar ou reabrir.')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Cancelar viagem Origem teste' }) as HTMLButtonElement).disabled).toBe(false);
});

it.each(['Concluída', 'Cancelada'])('reabre %s somente depois de confirmar preservando os dados', async status => {
  const encerrada = { ...viagem, status, motoristaAtivo: false, caminhaoAtivo: false };
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([encerrada]);
  vi.spyOn(viagensApi, 'obter').mockResolvedValue(encerrada);
  const atualizar = vi.spyOn(viagensApi, 'atualizar').mockResolvedValue();
  render(<ViagensPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Reabrir viagem Origem teste' }));
  const dialog = await screen.findByRole('dialog'); expect(atualizar).not.toHaveBeenCalled();
  expect(within(dialog).getByText(/Reabrir preserva os dados/)).toBeTruthy();
  if (status === 'Cancelada') expect(within(dialog).getByText(/O frete voltará a compor o saldo previsto/)).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar' })); expect(atualizar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Reabrir viagem Origem teste' }));
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmar alteração' }));
  await screen.findByText('Situação da viagem alterada para planejada.');
  expect(atualizar).toHaveBeenCalledWith('viagem', expect.objectContaining({ status: 'Planejada', motoristaId: 'motorista', caminhaoId: 'caminhao', valorFrete: 100.5 }));
});

it('regulariza viagem sem situacao pelo PUT sem cadastrar outra viagem', async () => {
  vinculos(); const antiga = { ...viagem, status: null, origem: null, destino: null, dataViagem: null, motoristaId: null, caminhaoId: null, gerarRemuneracaoAutomatica: false };
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([antiga]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(antiga);
  const atualizar = vi.spyOn(viagensApi, 'atualizar').mockResolvedValue();
  const cadastrar = vi.spyOn(viagensApi, 'cadastrar').mockResolvedValue(viagem);
  render(<ViagensPage />); fireEvent.click(await screen.findByRole('button', { name: 'Regularizar viagem sem origem' }));
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByRole('option', { name: 'Motorista teste' });
  expect(within(dialog).getByText(/sem remuneração retroativa/)).toBeTruthy();
  for (const [label, value] of [['Origem', 'Origem corrigida'], ['Destino', 'Destino corrigido'], ['Data da viagem', '2030-01-02'], ['Motorista', 'motorista'], ['Caminhão', 'caminhao']])
    fireEvent.change(within(dialog).getByLabelText(`${label} (obrigatório)`), { target: { value } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Regularizar viagem' }));
  await screen.findByText('Viagem regularizada como planejada.');
  expect(atualizar).toHaveBeenCalledWith('viagem', expect.objectContaining({ origem: 'Origem corrigida', destino: 'Destino corrigido', status: 'Planejada' }));
  expect(cadastrar).not.toHaveBeenCalled();
});

it('mantem confirmacao de reabertura aberta em conflito sem anunciar sucesso', async () => {
  const antiga = { ...viagem, status: 'Cancelada' };
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([antiga]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(antiga);
  vi.spyOn(viagensApi, 'atualizar').mockRejectedValue(new HttpError(409, 'A viagem mudou.', {}));
  render(<ViagensPage />); fireEvent.click(await screen.findByRole('button', { name: 'Reabrir viagem Origem teste' }));
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmar alteração' }));
  expect(await screen.findByRole('alert')).toBeTruthy(); expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.queryByText('Situação da viagem alterada para planejada.')).toBeNull();
});

it('cancela sem despesas pela confirmacao versionada e nao altera os dados pelo PUT', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(viagem);
  vi.spyOn(viagensApi, 'prepararCancelamento').mockResolvedValue({ quantidadeDespesas: 0, totalDespesas: 0, versaoDespesas: 'versao' });
  const cancelar = vi.spyOn(viagensApi, 'confirmarCancelamento').mockResolvedValue();
  const atualizar = vi.spyOn(viagensApi, 'atualizar').mockResolvedValue(); render(<ViagensPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar viagem Origem teste' }));
  const dialog = await screen.findByRole('dialog'); expect(cancelar).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar alteração' }));
  await screen.findByText('Situação da viagem alterada para cancelada.');
  expect(cancelar).toHaveBeenCalledWith('viagem', 'versao', null); expect(atualizar).not.toHaveBeenCalled();
});
it('nao oferece edicao ou cancelamento de concluida e apresenta legado nulo', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([{ ...viagem, status: 'Concluída' }, { ...viagem, id: 'legado', origem: null, destino: null, dataViagem: null, motoristaId: null, motoristaNome: null, caminhaoId: null, caminhaoPlaca: null, valorFrete: null, status: null }]);
  render(<ViagensPage />); await screen.findByText('Origem teste');
  expect(screen.queryByRole('button', { name: /Editar viagem/ })).toBeNull(); expect(screen.queryByRole('button', { name: /Cancelar viagem/ })).toBeNull();
  expect(screen.getByText('Origem não informada')).toBeTruthy(); expect(screen.getByText('Dados incompletos')).toBeTruthy();
});

it.each(['Concluída', 'Cancelada'])('abre detalhes de viagem %s sem permitir alteracoes de dados', async status => {
  const encerrada = { ...viagem, status };
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([encerrada]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(encerrada);
  render(<ViagensPage />); fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes da viagem Origem teste' }));
  const dialog = await screen.findByRole('dialog'); expect(within(dialog).getByText(status)).toBeTruthy();
  expect(within(dialog).getByText('Destino teste')).toBeTruthy(); expect(within(dialog).queryByRole('textbox')).toBeNull();
  expect(within(dialog).getByRole('button', { name: 'Lançar despesa nesta viagem' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Editar viagem Origem teste' })).toBeNull();
});

it('atalho de despesa navega com a viagem na URL sem alterar registros', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]);
  const cadastrar = vi.spyOn(viagensApi, 'cadastrar').mockResolvedValue(viagem);
  render(<ViagensPage />);
  try {
    fireEvent.click(await screen.findByRole('button', { name: 'Lançar despesa na viagem Origem teste' }));
    expect(window.location.hash).toBe('#/despesas?viagemId=viagem'); expect(cadastrar).not.toHaveBeenCalled();
  } finally { window.history.replaceState(null, '', '/'); }
});

it.each([['Manter no financeiro', true], ['Desconsiderar no financeiro e preservar no histórico', false]] as const)('exige escolha explicita para %s e envia a versao apresentada', async (opcao, manter) => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(viagem);
  vi.spyOn(viagensApi, 'prepararCancelamento').mockResolvedValue({ quantidadeDespesas: 2, totalDespesas: 75, versaoDespesas: 'versao-consultada' });
  const confirmar = vi.spyOn(viagensApi, 'confirmarCancelamento').mockResolvedValue();
  render(<ViagensPage />); fireEvent.click(await screen.findByRole('button', { name: 'Cancelar viagem Origem teste' }));
  const dialog = await screen.findByRole('dialog');
  const botao = within(dialog).getByRole('button', { name: 'Confirmar alteração' }) as HTMLButtonElement;
  expect(botao.disabled).toBe(true); expect(confirmar).not.toHaveBeenCalled();
  expect(within(dialog).getByText(/2 despesa\(s\)/)).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('radio', { name: opcao })); expect(botao.disabled).toBe(false);
  fireEvent.click(botao); await screen.findByText('Situação da viagem alterada para cancelada.');
  expect(confirmar).toHaveBeenCalledWith('viagem', 'versao-consultada', manter);
});

it('mantem o painel aberto se as despesas mudaram e a API retorna conflito', async () => {
  vi.spyOn(viagensApi, 'listar').mockResolvedValue([viagem]); vi.spyOn(viagensApi, 'obter').mockResolvedValue(viagem);
  vi.spyOn(viagensApi, 'prepararCancelamento').mockResolvedValue({ quantidadeDespesas: 1, totalDespesas: 25, versaoDespesas: 'antiga' });
  vi.spyOn(viagensApi, 'confirmarCancelamento').mockRejectedValue(new HttpError(409, 'Revise as despesas antes de cancelar.'));
  render(<ViagensPage />); fireEvent.click(await screen.findByRole('button', { name: 'Cancelar viagem Origem teste' }));
  const dialog = await screen.findByRole('dialog'); fireEvent.click(within(dialog).getByRole('radio', { name: 'Manter no financeiro' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar alteração' }));
  await within(dialog).findByText('Revise as despesas antes de cancelar.');
  expect(screen.queryByText('Situação da viagem alterada para cancelada.')).toBeNull();
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
