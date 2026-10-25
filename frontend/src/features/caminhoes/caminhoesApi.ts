import { request } from '../../api/http';
import type { AtualizarCaminhao, Caminhao, CriarCaminhao } from './types';

const base = '/api/Caminhoes';
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const caminhoesApi = {
  listar: (incluirInativos: boolean, signal?: AbortSignal) => request<Caminhao[]>(`${base}?incluirInativos=${incluirInativos}`, { signal }),
  obter: (id: string) => request<Caminhao>(`${base}/${encodeURIComponent(id)}`),
  cadastrar: (body: CriarCaminhao) => request<Caminhao>(base, json('POST', body)),
  atualizar: (id: string, body: AtualizarCaminhao) => request<void>(`${base}/${encodeURIComponent(id)}`, json('PUT', body)),
  desativar: (id: string) => request<void>(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
