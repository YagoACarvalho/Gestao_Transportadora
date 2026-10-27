import { request } from '../../api/http';
export interface ResumoFinanceiro {
  dataInicial: string | null; dataFinal: string | null; totalFretes: number; totalDespesas: number;
  totalDespesasViagens: number; totalDespesasGerais: number;
  totalRemuneracaoMotoristas: number;
  lucro: number; // Nome legado do contrato. A interface apresenta saldo previsto.
}
export const financeiroApi = {
  resumo: (inicio: string, fim: string, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (inicio) params.set('dataInicial', inicio);
    if (fim) params.set('dataFinal', fim);
    return request<ResumoFinanceiro>(`/api/Relatorios/resumo-financeiro${params.size ? `?${params}` : ''}`, { signal }).then(resumo => {
      if (![resumo.totalFretes, resumo.totalDespesas, resumo.totalDespesasViagens, resumo.totalDespesasGerais, resumo.totalRemuneracaoMotoristas, resumo.lucro].every(valor => typeof valor === 'number' && Number.isFinite(valor))) {
        throw new Error('O resumo financeiro está incompleto. Atualize a API e tente novamente.');
      }
      return resumo;
    });
  },
};
