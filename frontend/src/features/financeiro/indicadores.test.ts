import { expect, it } from 'vitest';
import { montarIndicadores, periodoDoMes } from './indicadores';
import type { Despesa } from '../despesas/types';
import type { Viagem } from '../viagens/types';

const despesa: Despesa = { id: 'teste', descricao: 'Teste isolado', categoria: 'Teste', valor: 0.1, dataDespesa: '2030-01-02', viagemId: null, viagem: null, dataCadastro: '2030-01-02T12:00:00Z' };
const viagem: Viagem = { id: 'teste', origem: null, destino: null, dataViagem: '2030-01-02', motoristaId: null, motoristaNome: null, motoristaAtivo: null, caminhaoId: null, caminhaoPlaca: null, caminhaoAtivo: null, valorFrete: 10, status: null, dataCadastro: '' };

it('agrupa meses e categorias sem somar fretes cancelados ou perder despesas vinculadas', () => {
  const resultado = montarIndicadores([despesa, { ...despesa, id: 'outra', valor: 0.2, viagemId: 'cancelada' }, { ...despesa, id: 'fev', dataDespesa: '2030-02-01', valor: 2 }], [viagem, { ...viagem, status: 'Cancelada', valorFrete: 900 }], '', '');
  expect(resultado.meses).toEqual([{ mes: '2030-01', fretes: 10, despesas: 0.3 }, { mes: '2030-02', fretes: 0, despesas: 2 }]);
  expect(resultado.categorias).toEqual([{ nome: 'Teste', valor: 2.3 }]);
  expect(resultado.recentes[0].id).toBe('fev');
});
it('aplica periodo civil inclusivo e trata registros sem data e valor legados', () => {
  const despesas = [despesa, { ...despesa, id: 'sem-data', dataDespesa: null, valor: 5 }, { ...despesa, id: 'sem-valor', valor: null, categoria: null }];
  const filtrado = montarIndicadores(despesas, [viagem], '2030-01-02', '2030-01-02');
  expect(filtrado.meses).toEqual([{ mes: '2030-01', fretes: 10, despesas: 0.1 }]);
  expect(filtrado.recentes).toHaveLength(2); expect(filtrado.semData).toBe(false);
  const completo = montarIndicadores(despesas, [{ ...viagem, dataViagem: null }], '', '');
  expect(completo.semData).toBe(true); expect(completo.meses[0].fretes).toBe(0);
  expect(completo.categorias).toContainEqual({ nome: 'Teste', valor: 5.1 });
});
it('retorna estados vazios sem inventar meses e limita recentes sem alterar a entrada', () => {
  expect(montarIndicadores([], [], '', '')).toEqual({ meses: [], categorias: [], recentes: [], semData: false });
  const items = Array.from({ length: 8 }, (_, i) => ({ ...despesa, id: String(i), dataDespesa: `2030-01-0${i + 1}` }));
  const resultado = montarIndicadores(items, [], '', '');
  expect(resultado.recentes).toHaveLength(6); expect(resultado.recentes[0].id).toBe('7'); expect(items[0].id).toBe('0');
});
it('calcula meses civis locais incluindo fevereiro bissexto e virada de ano', () => {
  expect(periodoDoMes(-1, new Date(2030, 0, 15))).toEqual({ inicio: '2029-12-01', fim: '2029-12-31' });
  expect(periodoDoMes(0, new Date(2028, 1, 15))).toEqual({ inicio: '2028-02-01', fim: '2028-02-29' });
});

it('desconsidera lancamentos em todos os graficos e recentes sem apaga-los da entrada', () => {
  const items = [despesa, { ...despesa, id: 'desconsiderada', valor: 900, considerarNoFinanceiro: false }];
  const resultado = montarIndicadores(items, [], '', '');
  expect(resultado.meses[0].despesas).toBe(0.1); expect(resultado.categorias[0].valor).toBe(0.1);
  expect(resultado.recentes).toHaveLength(1); expect(items).toHaveLength(2);
});
