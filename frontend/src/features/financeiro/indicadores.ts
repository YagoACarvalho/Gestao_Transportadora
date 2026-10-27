import type { Despesa } from '../despesas/types';
import type { Viagem } from '../viagens/types';

export function montarIndicadores(despesas: Despesa[], viagens: Viagem[], inicio: string, fim: string) {
  const noPeriodo = (data: string | null) => (!inicio || !!data && data >= inicio) && (!fim || !!data && data <= fim);
  const lancamentos = despesas.filter(item => item.considerarNoFinanceiro !== false && noPeriodo(item.dataDespesa));
  const meses = new Map<string, { mes: string; fretes: number; despesas: number }>();
  const categorias = new Map<string, number>();
  const obterMes = (data: string) => {
    const mes = data.slice(0, 7);
    if (!meses.has(mes)) meses.set(mes, { mes, fretes: 0, despesas: 0 });
    return meses.get(mes)!;
  };
  for (const item of lancamentos) {
    const centavos = Math.round((item.valor ?? 0) * 100);
    const categoria = item.categoria?.trim() || 'Categoria não informada';
    categorias.set(categoria, (categorias.get(categoria) ?? 0) + centavos);
    if (item.dataDespesa) obterMes(item.dataDespesa).despesas += centavos;
  }
  for (const viagem of viagens) {
    if (viagem.status !== 'Cancelada' && noPeriodo(viagem.dataViagem) && viagem.dataViagem) {
      obterMes(viagem.dataViagem).fretes += Math.round((viagem.valorFrete ?? 0) * 100);
    }
  }
  return {
    meses: [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes)).map(item => ({ ...item, fretes: item.fretes / 100, despesas: item.despesas / 100 })),
    categorias: [...categorias].map(([nome, centavos]) => ({ nome, valor: centavos / 100 })).sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome)),
    recentes: [...lancamentos].sort((a, b) => (b.dataDespesa ?? '').localeCompare(a.dataDespesa ?? '') || b.dataCadastro.localeCompare(a.dataCadastro) || a.id.localeCompare(b.id)).slice(0, 6),
    semData: lancamentos.some(item => !item.dataDespesa) || viagens.some(item => item.status !== 'Cancelada' && noPeriodo(item.dataViagem) && !item.dataViagem),
  };
}

export function periodoDoMes(deslocamento: number, hoje = new Date()) {
  const ano = hoje.getFullYear(); const mes = hoje.getMonth() + deslocamento;
  const primeiro = new Date(ano, mes, 1); const ultimo = new Date(ano, mes + 1, 0);
  const civil = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  return { inicio: civil(primeiro), fim: civil(ultimo) };
}
