import type { Despesa } from '../despesas/types';
import type { Viagem } from '../viagens/types';

const noPeriodo = (data: string | null, inicio: string, fim: string) =>
  (!inicio || !!data && data >= inicio) && (!fim || !!data && data <= fim);

export function viagensDoMotorista(id: string, viagens: Viagem[], inicio = '', fim = '', status = '') {
  return viagens.filter(viagem => viagem.motoristaId === id && noPeriodo(viagem.dataViagem, inicio, fim) && (!status || viagem.status === status))
    .sort((a, b) => (b.dataViagem ?? '').localeCompare(a.dataViagem ?? '') || a.id.localeCompare(b.id));
}

export function remuneracaoDoMotorista(id: string, viagens: Viagem[], despesas: Despesa[], inicio = '', fim = '') {
  // A API associa a remuneração à viagem, sem guardar um beneficiário histórico.
  // Por isso a seleção usa os vínculos atuais, sem inferir por nome ou categoria.
  const vinculadas = new Map(viagens.filter(viagem => viagem.motoristaId === id).map(viagem => [viagem.id, viagem]));
  const lancamentos = despesas.filter(despesa => despesa.origem === 'RemuneracaoMotorista' &&
    despesa.viagemId !== null && vinculadas.has(despesa.viagemId) && noPeriodo(despesa.dataDespesa, inicio, fim))
    .sort((a, b) => (b.dataDespesa ?? '').localeCompare(a.dataDespesa ?? '') || a.id.localeCompare(b.id))
    .map(despesa => ({ ...despesa, percurso: vinculadas.get(despesa.viagemId!)! }));
  const incluidos = lancamentos.filter(item => item.considerarNoFinanceiro !== false);
  const historico = lancamentos.filter(item => item.considerarNoFinanceiro === false);
  // Somar os lançamentos já arredondados pelo backend, nunca 15% do frete agregado.
  const somar = (items: Despesa[]) => items.some(item => item.valor === null || !Number.isFinite(item.valor)) ? null
    : items.reduce((total, item) => total + Math.round(item.valor! * 100), 0) / 100;
  return { lancamentos, totalPrevisto: somar(incluidos), totalHistorico: somar(historico), quantidadeIncluida: incluidos.length };
}
