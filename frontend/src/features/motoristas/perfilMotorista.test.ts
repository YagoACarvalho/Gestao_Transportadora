import { expect, it } from 'vitest';
import { remuneracaoDoMotorista, viagensDoMotorista } from './perfilMotorista';
import type { Despesa } from '../despesas/types';
import type { Viagem } from '../viagens/types';

const viagem: Viagem = { id: 'v1', motoristaId: 'm1', motoristaNome: 'Mesmo nome', motoristaAtivo: false,
  caminhaoId: 'c1', caminhaoPlaca: 'ABC1D23', caminhaoAtivo: true, origem: 'Origem', destino: 'Destino',
  dataViagem: '2026-10-15', valorFrete: 1500.5, status: 'Concluída', dataCadastro: '2026-10-01T00:00:00Z' };
const despesa: Despesa = { id: 'd1', viagemId: 'v1', origem: 'RemuneracaoMotorista', considerarNoFinanceiro: true,
  descricao: 'Remuneração', categoria: 'Motorista', valor: 225.08, dataDespesa: '2026-10-15', dataCadastro: '2026-10-01T00:00:00Z', viagem: null };

it('seleciona por ID e preserva viagens de motorista inativo em todas as fases', () => {
  const viagens = [viagem, { ...viagem, id: 'v2', motoristaId: 'm2' }, { ...viagem, id: 'v3', status: 'Cancelada' }];
  expect(viagensDoMotorista('m1', viagens).map(item => item.id)).toEqual(['v1', 'v3']);
  expect(viagensDoMotorista('m1', viagens, '', '', 'Cancelada').map(item => item.id)).toEqual(['v3']);
  expect(viagens.map(item => item.id)).toEqual(['v1', 'v2', 'v3']);
});

it('filtra datas civis de forma inclusiva e so inclui legados sem data na consulta sem limites', () => {
  const viagens = [viagem, { ...viagem, id: 'sem-data', dataViagem: null }, { ...viagem, id: 'anterior', dataViagem: '2026-10-14' }];
  expect(viagensDoMotorista('m1', viagens, '2026-10-15', '2026-10-15').map(item => item.id)).toEqual(['v1']);
  expect(viagensDoMotorista('m1', viagens)).toHaveLength(3);
  expect(viagensDoMotorista('m1', viagens, '', '2026-10-15')).toHaveLength(2);
});

it('soma valores registrados em centavos sem recalcular 15% dos fretes', () => {
  const result = remuneracaoDoMotorista('m1', [viagem, { ...viagem, id: 'v2', valorFrete: 0.1 }],
    [despesa, { ...despesa, id: 'd2', viagemId: 'v2', valor: 0.02 }]);
  expect(result.totalPrevisto).toBe(225.10);
  expect(result.totalPrevisto).not.toBe(Math.round((1500.5 + 0.1) * 15) / 100);
});

it('ignora despesas manuais, origem ausente, vinculos orfaos e viagens de outro motorista', () => {
  const result = remuneracaoDoMotorista('m1', [viagem, { ...viagem, id: 'outro', motoristaId: 'm2' }], [
    despesa, { ...despesa, id: 'manual', origem: 'Manual' }, { ...despesa, id: 'legado', origem: undefined },
    { ...despesa, id: 'orfao', viagemId: 'inexistente' }, { ...despesa, id: 'geral', viagemId: null },
    { ...despesa, id: 'outro', viagemId: 'outro' },
  ]);
  expect(result.lancamentos.map(item => item.id)).toEqual(['d1']);
  expect(result.totalPrevisto).toBe(225.08);
});

it('respeita inclusao financeira de canceladas e separa historico sem apagar registros', () => {
  const result = remuneracaoDoMotorista('m1', [{ ...viagem, status: 'Cancelada' }], [despesa,
    { ...despesa, id: 'desconsiderada', valor: 10.02, considerarNoFinanceiro: false }]);
  expect(result.totalPrevisto).toBe(225.08);
  expect(result.totalHistorico).toBe(10.02);
  expect(result.lancamentos).toHaveLength(2);
});

it('usa data do lancamento, independentemente da data e da situacao da viagem', () => {
  const result = remuneracaoDoMotorista('m1', [{ ...viagem, dataViagem: '2026-09-01', status: 'Pausada' }], [despesa,
    { ...despesa, id: 'sem-data', dataDespesa: null }], '2026-10-15', '2026-10-15');
  expect(result.lancamentos.map(item => item.id)).toEqual(['d1']);
  expect(result.totalPrevisto).toBe(225.08);
});

it('nao gera valores retroativos e nao transforma valor desconhecido em zero', () => {
  expect(remuneracaoDoMotorista('m1', [viagem], []).totalPrevisto).toBe(0);
  const result = remuneracaoDoMotorista('m1', [viagem], [despesa, { ...despesa, id: 'incompleto', valor: null }]);
  expect(result.totalPrevisto).toBeNull();
  expect(result.totalHistorico).toBe(0);
  expect(result.lancamentos).toHaveLength(2);
});

it('segue o vinculo atual quando uma viagem muda de motorista', () => {
  const viagens = [{ ...viagem, motoristaId: 'm2' }];
  expect(remuneracaoDoMotorista('m1', viagens, [despesa]).lancamentos).toHaveLength(0);
  expect(remuneracaoDoMotorista('m2', viagens, [despesa]).totalPrevisto).toBe(225.08);
});
