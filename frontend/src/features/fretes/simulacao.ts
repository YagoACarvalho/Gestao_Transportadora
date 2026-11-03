import type { CustosFrete, Endereco, EntradaFrete, ResultadoFrete } from './types';

export const custosIniciais: CustosFrete = { consumo: 2.5, diesel: 0, margem: 15, outrosPorKm: 0, fixos: 0 };
export function precoFrete(resultado: ResultadoFrete, custos: CustosFrete) {
  if (!custosValidos(custos) || custos.diesel <= 0) throw new Error('Informe consumo e preço do diesel positivos para sugerir um preço.');
  const distancia = resultado.distanciaKm + resultado.distanciaRetornoKm;
  const combustivel = distancia / custos.consumo * custos.diesel;
  const custo = combustivel + distancia * custos.outrosPorKm + custos.fixos + (resultado.pedagio ?? 0) + resultado.adicionais;
  const arredondar = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
  return { combustivel: arredondar(combustivel), custo: arredondar(custo), sugerido: arredondar(Math.max(resultado.totalOperacao, custo * (1 + custos.margem / 100))) };
}
const numero = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
export function custosValidos(v: unknown): v is CustosFrete {
  if (!v || typeof v !== 'object') return false;
  const c = v as CustosFrete;
  return numero(c.consumo, .1, 100) && numero(c.diesel, 0, 100) && numero(c.margem, 0, 1000) && numero(c.outrosPorKm, 0, 10000) && numero(c.fixos, 0, 1000000);
}
export function lerCustos(): CustosFrete {
  try { const v: unknown = JSON.parse(localStorage.getItem('fretes:custos:v1') ?? 'null'); return custosValidos(v) ? v : custosIniciais; }
  catch { return custosIniciais; }
}
export function guardarCustos(c: CustosFrete) {
  try { if (custosValidos(c)) localStorage.setItem('fretes:custos:v1', JSON.stringify(c)); } catch { /* Cálculo continua sem armazenamento local. */ }
}
export function entradaInicial(hoje: string): EntradaFrete {
  return { origem: { texto: '' }, destino: { texto: '' }, paradas: [], tipoCarga: 5, eixos: 6, contratacao: 'composicao', altoDesempenho: false, retornoEspecial: false, dataReferencia: hoje, altura: null, largura: null, comprimento: null, peso: null, pedagio: null, adicionais: 0 };
}
function endereco(v: unknown): v is Endereco {
  if (!v || typeof v !== 'object') return false;
  const e = v as Endereco;
  return typeof e.texto === 'string' && e.texto.trim().length >= 4 && e.texto.length <= 250 &&
    (e.ponto == null || typeof e.ponto === 'object' && numero(e.ponto.lat, -34.5, 5.5) && numero(e.ponto.lon, -74.5, -28.5));
}
function dataValida(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
}
export function validarEntrada(v: unknown): asserts v is EntradaFrete {
  if (!v || typeof v !== 'object') throw new Error('Simulação inválida.');
  const e = v as EntradaFrete;
  const opcional = (v: unknown, max: number) => v === null || numero(v, .1, max);
  const monetario = (v: unknown) => numero(v, 0, 1000000) && Math.abs(v * 100 - Math.round(v * 100)) < .00001;
  if (!endereco(e.origem) || !endereco(e.destino) || !Array.isArray(e.paradas) || e.paradas.length > 5 || !e.paradas.every(endereco) ||
    !Number.isInteger(e.tipoCarga) || !numero(e.tipoCarga, 1, 12) || !Number.isInteger(e.eixos) || !numero(e.eixos, 2, 20) ||
    !['composicao', 'tracao'].includes(e.contratacao) || typeof e.altoDesempenho !== 'boolean' || typeof e.retornoEspecial !== 'boolean' || !dataValida(e.dataReferencia) ||
    !opcional(e.altura, 6) || !opcional(e.largura, 4) || !opcional(e.comprimento, 40) || !opcional(e.peso, 100) || !(e.pedagio === null || monetario(e.pedagio)) || !monetario(e.adicionais))
    throw new Error('Revise os endereços, a data, os eixos e os valores da simulação.');
}
// Apenas campos conhecidos entram no link; nunca incluir respostas, tokens ou opções extras.
function camposEntrada(e: EntradaFrete): EntradaFrete {
  const ponto = (a: Endereco): Endereco => ({ texto: a.texto, ...(a.ponto ? { ponto: { lat: a.ponto.lat, lon: a.ponto.lon } } : {}) });
  return { origem: ponto(e.origem), destino: ponto(e.destino), paradas: e.paradas.map(ponto), tipoCarga: e.tipoCarga, eixos: e.eixos,
    contratacao: e.contratacao, altoDesempenho: e.altoDesempenho, retornoEspecial: e.retornoEspecial, dataReferencia: e.dataReferencia,
    altura: e.altura, largura: e.largura, comprimento: e.comprimento, peso: e.peso, pedagio: e.pedagio, adicionais: e.adicionais };
}
export function codificarSimulacao(entrada: EntradaFrete, custos: CustosFrete): string {
  validarEntrada(entrada);
  if (!custosValidos(custos)) throw new Error('Custos inválidos.');
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, entrada: camposEntrada(entrada), custos: { consumo: custos.consumo, diesel: custos.diesel, margem: custos.margem, outrosPorKm: custos.outrosPorKm, fixos: custos.fixos } }));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodificarSimulacao(texto: string): { entrada: EntradaFrete; custos: CustosFrete } {
  if (texto.length > 16000 || !/^[\w-]+$/.test(texto)) throw new Error('Link de simulação inválido.');
  try {
    const v = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(texto.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))));
    if (v.v !== 1 || !custosValidos(v.custos)) throw new Error();
    validarEntrada(v.entrada);
    return { entrada: camposEntrada(v.entrada), custos: { consumo: v.custos.consumo, diesel: v.custos.diesel, margem: v.custos.margem, outrosPorKm: v.custos.outrosPorKm, fixos: v.custos.fixos } };
  } catch { throw new Error('Link de simulação inválido ou incompatível.'); }
}
export function linkGoogleMaps(e: EntradaFrete) {
  const params = new URLSearchParams({ api: '1', origin: e.origem.texto, destination: e.destino.texto, travelmode: 'driving' });
  if (e.paradas.length) params.set('waypoints', e.paradas.map(p => p.texto).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}
