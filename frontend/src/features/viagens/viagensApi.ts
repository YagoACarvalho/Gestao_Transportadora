import { request } from '../../api/http';
import type { AtualizarViagem, DadosViagem, Viagem } from './types';
type ViagemResposta = Omit<Viagem, 'motoristaNome' | 'motoristaAtivo' | 'caminhaoPlaca' | 'caminhaoAtivo'> & {
  motorista: { nome: string; ativo: boolean } | null;
  caminhao: { placa: string; ativo: boolean } | null;
};
// Adapta a resposta com entidades aninhadas da main, sem alterar o contrato HTTP.
function adaptar({ motorista, caminhao, ...viagem }: ViagemResposta): Viagem {
  return { ...viagem, motoristaNome: motorista?.nome ?? null, motoristaAtivo: motorista?.ativo ?? null,
    caminhaoPlaca: caminhao?.placa ?? null, caminhaoAtivo: caminhao?.ativo ?? null };
}
const base = '/api/Viagens';
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const viagensApi = {
  listar: async (signal?: AbortSignal) => (await request<ViagemResposta[]>(base, { signal })).map(adaptar),
  obter: async (id: string) => adaptar(await request<ViagemResposta>(`${base}/${encodeURIComponent(id)}`)),
  cadastrar: async (body: DadosViagem) => adaptar(await request<ViagemResposta>(base, json('POST', body))),
  atualizar: (id: string, body: AtualizarViagem) => request<void>(`${base}/${encodeURIComponent(id)}`, json('PUT', body)),
  cancelar: (id: string) => request<void>(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
