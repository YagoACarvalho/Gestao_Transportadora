import type { Viagem } from '../viagens/types';
import type { Despesa } from '../despesas/types';

export type TipoPerfil = 'motorista' | 'caminhao';
export interface GrupoOperacional {
  id: string | null; nome: string; viagens: Viagem[]; despesas: Despesa[];
  fretes: number | null; gastos: number | null; remuneracao: number | null; gastosDiretos: number | null;
}
export const noPeriodo = (data: string | null, inicio: string, fim: string) =>
  (!inicio || !!data && data >= inicio) && (!fim || !!data && data <= fim);
const soma = (valores: (number | null)[]) => valores.some(v => v === null || !Number.isFinite(v)) ? null
  : valores.reduce<number>((total, valor) => total + Math.round(valor! * 100), 0) / 100;

export function agruparOperacao(viagens: Viagem[], despesas: Despesa[], inicio = '', fim = '') {
  const porId = new Map(viagens.map(v => [v.id, v]));
  function agrupar(tipo: TipoPerfil) {
    const grupos = new Map<string | null, GrupoOperacional>();
    const obter = (id: string | null, nome?: string | null) => {
      if (!grupos.has(id)) grupos.set(id, { id, nome: nome || (id ? `Cadastro ${id.slice(0, 8)}` : 'Não atribuídos'), viagens: [], despesas: [], fretes: 0, gastos: 0, remuneracao: 0, gastosDiretos: 0 });
      const grupo = grupos.get(id)!;
      if (nome) grupo.nome = nome;
      return grupo;
    };
    for (const viagem of viagens) {
      if (!noPeriodo(viagem.dataViagem, inicio, fim)) continue;
      obter(tipo === 'motorista' ? viagem.motoristaId : viagem.caminhaoId,
        tipo === 'motorista' ? viagem.motoristaNome : viagem.caminhaoPlaca).viagens.push(viagem);
    }
    for (const despesa of despesas) {
      if (despesa.considerarNoFinanceiro === false || !noPeriodo(despesa.dataDespesa, inicio, fim)) continue;
      // Usa todas as viagens para atribuir despesas, mesmo quando a viagem está fora do período.
      const viagem = despesa.viagemId ? porId.get(despesa.viagemId) : undefined;
      const id = tipo === 'motorista' ? viagem?.motoristaId ?? null
        : despesa.viagemId ? viagem?.caminhaoId ?? null : despesa.caminhaoId ?? null;
      const nome = tipo === 'motorista' ? viagem?.motoristaNome
        : despesa.viagemId ? viagem?.caminhaoPlaca : despesa.caminhao?.placa;
      obter(id, nome).despesas.push(despesa);
    }
    for (const grupo of grupos.values()) {
      grupo.viagens.sort((a, b) => (b.dataViagem ?? '').localeCompare(a.dataViagem ?? '') || a.id.localeCompare(b.id));
      grupo.despesas.sort((a, b) => (b.dataDespesa ?? '').localeCompare(a.dataDespesa ?? '') || a.id.localeCompare(b.id));
      grupo.fretes = soma(grupo.viagens.filter(v => v.status !== 'Cancelada').map(v => v.valorFrete));
      grupo.gastos = soma(grupo.despesas.map(d => d.valor));
      grupo.remuneracao = soma(grupo.despesas.filter(d => d.origem === 'RemuneracaoMotorista').map(d => d.valor));
      grupo.gastosDiretos = soma(grupo.despesas.filter(d => !d.viagemId).map(d => d.valor));
    }
    return [...grupos.values()].sort((a, b) => a.id === null ? 1 : b.id === null ? -1 : a.nome.localeCompare(b.nome, 'pt-BR') || a.id.localeCompare(b.id));
  }
  return { motoristas: agrupar('motorista'), caminhoes: agrupar('caminhao') };
}

export function perfilUrl(tipo: TipoPerfil, id: string, inicio = '', fim = '') {
  const params = new URLSearchParams({ [tipo === 'motorista' ? 'motoristaId' : 'caminhaoId']: id });
  if (tipo === 'motorista') params.set('aba', 'resumo');
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  return `#/${tipo === 'motorista' ? 'motoristas' : 'caminhoes'}?${params}`;
}
