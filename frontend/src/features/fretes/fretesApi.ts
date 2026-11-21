import { HttpError, request } from '../../api/http';
import type { Endereco, EntradaFrete, OpcoesFrete, ResultadoFrete } from './types';

async function consulta<T>(path: string, options: RequestInit = {}, formato: 'json' | 'blob' = 'json') {
  try { return await request<T>(`/api/fretes/${path}`, options, formato); }
  catch (e) {
    if (e instanceof HttpError && e.status !== 401 && e.status !== 403) {
      const mensagens = Object.values(e.fields).flat();
      throw new Error(mensagens.join(' ') || (e.status === 429 ? 'Limite de consultas atingido. Aguarde um minuto e tente novamente.' : e.status === 503 ? 'O serviço de mapas está indisponível ou ainda não foi configurado. Tente novamente mais tarde.' : e.message));
    }
    throw e;
  }
}
export const fretesApi = {
  opcoes: (signal?: AbortSignal) => consulta<OpcoesFrete>('opcoes', { signal }),
  sugerir: (texto: string, signal: AbortSignal) => consulta<Endereco[]>(`sugestoes?texto=${encodeURIComponent(texto)}`, { signal }),
  calcular: async (entrada: EntradaFrete, signal: AbortSignal) => {
    const timeout = AbortSignal.timeout(60000);
    try {
      const resultado = await consulta<ResultadoFrete>('calcular', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entrada), signal: AbortSignal.any([signal, timeout]) });
      if (entrada.distanciaContratadaKm !== null && resultado.distanciaKm !== entrada.distanciaContratadaKm ||
        entrada.distanciaRetornoContratadaKm !== null && resultado.distanciaRetornoKm !== entrada.distanciaRetornoContratadaKm ||
        entrada.retornoComNovaCarga === true && (resultado.retornoVazio !== 0 || resultado.distanciaRetornoKm !== 0))
        throw new Error('A API não respeitou os parâmetros de distância ou retorno. Atualize o sistema antes de usar este cálculo.');
      return resultado;
    }
    catch (e) { if (timeout.aborted && !signal.aborted) throw new Error('O cálculo demorou a responder. Tente novamente.'); throw e; }
  },
  tile: (z: number, x: number, y: number, signal: AbortSignal) => consulta<Blob>(`mapa-tiles/${z}/${x}/${y}`, { signal }, 'blob'),
};
