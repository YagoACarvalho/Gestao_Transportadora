export interface Ponto { lat: number; lon: number }
export interface Endereco { texto: string; ponto?: Ponto | null }
export interface EntradaFrete {
  origem: Endereco; destino: Endereco; paradas: Endereco[];
  tipoCarga: number; eixos: number; contratacao: 'composicao' | 'tracao';
  altoDesempenho: boolean; retornoEspecial: boolean; dataReferencia: string;
  retornoComNovaCarga: boolean | null;
  distanciaContratadaKm: number | null; distanciaRetornoContratadaKm: number | null;
  altura: number | null; largura: number | null; comprimento: number | null; peso: number | null;
  pedagio: number | null; adicionais: number;
}
export interface ResultadoFrete {
  enderecos: Endereco[]; distanciaKm: number; distanciaRetornoKm: number; trechosKm: number[];
  trajetoIda: Ponto[]; trajetoRetorno: Ponto[];
  coeficientes: { tabela: string; eixosReferencia: number; ccd: number; cc: number };
  pisoIda: number; retornoVazio: number; pisoTotal: number; pedagio: number | null; adicionais: number;
  totalOperacao: number; norma: string; vigencia: string; fonte: string; avisos: string[];
}
export interface OpcoesFrete { tiposCarga: { id: number; nome: string }[]; hoje: string; mapasConfigurados: boolean; primeiraVigencia: string }
export interface CustosFrete { consumo: number; diesel: number; margem: number; outrosPorKm: number; fixos: number }
export interface Cenario { entrada: EntradaFrete; resultado: ResultadoFrete; custos: CustosFrete; criadoEm: string }
export const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const km = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`;
export const dataCivil = (v: string) => v.split('-').reverse().join('/');
