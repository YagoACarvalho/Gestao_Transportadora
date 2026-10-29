import { expect, it } from 'vitest';
import { agruparOperacao, perfilUrl } from './operacao';
import type { Viagem } from '../viagens/types';
import type { Despesa } from '../despesas/types';

export const viagemOperacional: Viagem = { id: 'v1', motoristaId: 'm1', motoristaNome: 'Marina', motoristaAtivo: false,
  caminhaoId: 'c1', caminhaoPlaca: 'ABC1234', caminhaoAtivo: false, origem: 'Curitiba', destino: 'Santos',
  dataViagem: '2030-01-10', dataCadastro: '', valorFrete: 1000, status: 'Concluída' };
export const despesaOperacional: Despesa = { id: 'd1', viagemId: 'v1', caminhaoId: null, viagem: null,
  descricao: 'Combustível', categoria: 'Operação', valor: 100, dataDespesa: '2030-01-11', dataCadastro: '', considerarNoFinanceiro: true };

it('correlaciona por IDs e mantém viagens canceladas fora dos fretes', () => {
  const viagens = [viagemOperacional, { ...viagemOperacional, id: 'v2', motoristaId: 'm2', valorFrete: 500, status: 'Cancelada' }];
  const grupos = agruparOperacao(viagens, [despesaOperacional, { ...despesaOperacional, id: 'd2', viagemId: 'v2', valor: 50 }]);
  expect(grupos.motoristas).toHaveLength(2);
  expect(grupos.motoristas.find(g => g.id === 'm2')).toMatchObject({ fretes: 0, gastos: 50 });
  expect(grupos.caminhoes[0]).toMatchObject({ fretes: 1000, gastos: 150 });
  expect(grupos.caminhoes[0].viagens).toHaveLength(2);
});
it('atribui custo pela data da despesa mesmo com viagem fora do período', () => {
  const grupos = agruparOperacao([viagemOperacional], [{ ...despesaOperacional, dataDespesa: '2030-02-10' }], '2030-02-01', '2030-02-28');
  expect(grupos.motoristas[0]).toMatchObject({ id: 'm1', fretes: 0, gastos: 100, viagens: [] });
  expect(grupos.caminhoes[0]).toMatchObject({ id: 'c1', gastos: 100 });
});
it('custo direto do caminhão não é distribuído a motoristas e não duplica totais', () => {
  const despesas = [despesaOperacional, { ...despesaOperacional, id: 'd2', viagemId: null, caminhaoId: 'c1', valor: 75 },
    { ...despesaOperacional, id: 'd3', origem: 'RemuneracaoMotorista' as const, valor: 150 }];
  const grupos = agruparOperacao([viagemOperacional], despesas);
  expect(grupos.motoristas.find(g => g.id === 'm1')).toMatchObject({ gastos: 250, remuneracao: 150 });
  expect(grupos.motoristas.find(g => g.id === null)?.gastos).toBe(75);
  expect(grupos.caminhoes[0]).toMatchObject({ gastos: 325, gastosDiretos: 75, remuneracao: 150 });
  for (const visao of [grupos.motoristas, grupos.caminhoes]) expect(visao.reduce((s, g) => s + g.gastos!, 0)).toBe(325);
});
it('preserva custos não atribuídos e ignora desconsiderados', () => {
  const grupos = agruparOperacao([], [despesaOperacional, { ...despesaOperacional, id: 'd2', valor: 200, considerarNoFinanceiro: false }]);
  expect(grupos.motoristas[0]).toMatchObject({ id: null, gastos: 100 });
  expect(grupos.caminhoes[0]).toMatchObject({ id: null, gastos: 100 });
});
it('aplica limites inclusivos e trata sem data apenas no histórico completo', () => {
  const viagens = [viagemOperacional, { ...viagemOperacional, id: 'v2', dataViagem: null }];
  const despesas = [despesaOperacional, { ...despesaOperacional, id: 'd2', dataDespesa: null }];
  expect(agruparOperacao(viagens, despesas).motoristas[0].viagens).toHaveLength(2);
  const grupo = agruparOperacao(viagens, despesas, '2030-01-10', '2030-01-11').motoristas[0];
  expect(grupo.viagens).toHaveLength(1); expect(grupo.despesas).toHaveLength(1);
});
it('não inventa zero para valores desconhecidos e soma centavos sem erro de ponto flutuante', () => {
  const grupo = agruparOperacao([{ ...viagemOperacional, valorFrete: null }], [
    { ...despesaOperacional, valor: 0.1 }, { ...despesaOperacional, id: 'd2', valor: 0.2 }]).motoristas[0];
  expect(grupo.fretes).toBeNull(); expect(grupo.gastos).toBe(0.3);
  expect(agruparOperacao([viagemOperacional], [{ ...despesaOperacional, valor: null }]).motoristas[0].gastos).toBeNull();
});
it('não conta duas vezes um lançamento legado com ambos os vínculos', () => {
  const grupos = agruparOperacao([viagemOperacional], [{ ...despesaOperacional, caminhaoId: 'c2' }]);
  expect(grupos.caminhoes).toHaveLength(1); expect(grupos.caminhoes[0]).toMatchObject({ id: 'c1', gastos: 100 });
});
it('codifica IDs e transfere datas para os perfis', () => {
  const url = perfilUrl('motorista', 'm/1', '2030-01-01', '2030-01-31');
  expect(url).toBe('#/motoristas?motoristaId=m%2F1&aba=resumo&inicio=2030-01-01&fim=2030-01-31');
  expect(perfilUrl('caminhao', 'c1')).toBe('#/caminhoes?caminhaoId=c1');
});
