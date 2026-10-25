import { request } from '../../api/http';
import type { AtualizarViagem, DadosViagem, Viagem } from './types';
const base = '/api/Viagens';
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const viagensApi = {
  listar: (signal?: AbortSignal) => request<Viagem[]>(base, { signal }),
  obter: (id: string) => request<Viagem>(`${base}/${encodeURIComponent(id)}`),
  cadastrar: (body: DadosViagem) => request<Viagem>(base, json('POST', body)),
  atualizar: (id: string, body: AtualizarViagem) => request<void>(`${base}/${encodeURIComponent(id)}`, json('PUT', body)),
};
