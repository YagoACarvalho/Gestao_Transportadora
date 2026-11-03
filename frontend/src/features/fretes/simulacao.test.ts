import { describe, expect, it } from 'vitest';
import { codificarSimulacao, custosIniciais, decodificarSimulacao, entradaInicial, precoFrete, validarEntrada } from './simulacao';
import type { ResultadoFrete } from './types';

const entrada = () => ({ ...entradaInicial('2026-10-01'), origem: { texto: 'São Paulo, SP', ponto: { lat: -23.55, lon: -46.63 } }, destino: { texto: 'São José dos Campos, SP' } });
describe('simulação de frete', () => {
  it('compartilha Unicode e apenas dados de entrada, sem incluir resultado ou token', () => {
    const e = { ...entrada(), token: 'nao-compartilhar', resultado: { valor: 1 } };
    const codigo = codificarSimulacao(e, custosIniciais); const lida = decodificarSimulacao(codigo);
    expect(lida.entrada).toEqual(entrada()); expect(JSON.stringify(lida)).not.toContain('nao-compartilhar');
  });
  it('recusa links excessivos e campos adulterados', () => {
    expect(() => decodificarSimulacao('x'.repeat(16001))).toThrow();
    expect(() => decodificarSimulacao(btoa(JSON.stringify({ v: 1, entrada: { ...entrada(), eixos: '6' }, custos: custosIniciais })))).toThrow();
    expect(() => validarEntrada({ ...entrada(), pedagio: -1 })).toThrow();
    expect(() => validarEntrada({ ...entrada(), pedagio: 2.333 })).toThrow();
    expect(() => validarEntrada({ ...entrada(), origem: { texto: 'Exterior', ponto: { lat: 40, lon: 2 } } })).toThrow();
    expect(() => validarEntrada({ ...entrada(), dataReferencia: '2026-02-31' })).toThrow();
  });
  it('limita a cinco paradas', () => { expect(() => validarEntrada({ ...entrada(), paradas: Array(6).fill({ texto: 'Parada de teste' }) })).toThrow(); });
  it('considera os quilômetros próprios de retorno e preserva o mínimo da operação', () => {
    const r = { distanciaKm: 200, distanciaRetornoKm: 230, pedagio: 100, adicionais: 50, totalOperacao: 2800 } as ResultadoFrete;
    expect(precoFrete(r, { consumo: 2, diesel: 6, margem: 10, outrosPorKm: 1, fixos: 100 })).toEqual({ combustivel: 1290, custo: 1970, sugerido: 2800 });
    expect(precoFrete(r, { consumo: 1, diesel: 10, margem: 10, outrosPorKm: 0, fixos: 0 }).sugerido).toBe(4895);
    expect(() => precoFrete(r, { ...custosIniciais, consumo: 0 })).toThrow();
    expect(() => precoFrete(r, custosIniciais)).toThrow();
  });
});
