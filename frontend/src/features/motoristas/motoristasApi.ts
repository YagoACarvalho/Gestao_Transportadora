import { request } from '../../api/http';
import type { AtualizarMotorista, CriarMotorista, Motorista } from './types';
const base = '/api/Motoristas';
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const motoristasApi = {
  listar: (incluirInativos: boolean, signal?: AbortSignal) => request<Motorista[]>(`${base}?incluirInativos=${incluirInativos}`, { signal }),
  obter: (id: string) => request<Motorista>(`${base}/${encodeURIComponent(id)}`),
  cadastrar: (body: CriarMotorista) => request<Motorista>(base, json('POST', body)),
  atualizar: (id: string, body: AtualizarMotorista) => request<void>(`${base}/${encodeURIComponent(id)}`, json('PUT', body)),
  desativar: (id: string) => request<void>(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
