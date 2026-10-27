import { request } from '../../api/http';
import type { DadosDespesa, Despesa } from './types';
const base = '/api/Despesas';
const json = (method: string, body: DadosDespesa): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const despesasApi = {
  listar: (signal?: AbortSignal) => request<Despesa[]>(base, { signal }),
  obter: (id: string) => request<Despesa>(`${base}/${encodeURIComponent(id)}`),
  cadastrar: (body: DadosDespesa) => request<Despesa>(base, json('POST', body)),
  atualizar: (id: string, body: DadosDespesa) => request<void>(`${base}/${encodeURIComponent(id)}`, json('PUT', body)),
  excluir: (id: string) => request<void>(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  alterarSituacaoFinanceira: (id: string, considerarNoFinanceiro: boolean) => request<void>(`${base}/${encodeURIComponent(id)}/situacao-financeira`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ considerarNoFinanceiro }),
  }),
};
