import { expect, it, vi } from 'vitest';
import { viagensApi } from './viagensApi';
import { filtrarViagens, formatarData, parseFrete, proximasSituacoes } from './types';
import type { DadosViagem, Viagem } from './types';

const dados: DadosViagem = { origem: 'Origem teste', destino: 'Destino teste', dataViagem: '2030-01-02', motoristaId: 'motorista', caminhaoId: 'caminhao', valorFrete: 1500.50 };
const viagem: Viagem = { ...dados, id: 'teste', motoristaNome: 'Motorista teste', motoristaAtivo: true, caminhaoPlaca: 'TESTE01', caminhaoAtivo: true, status: 'Planejada', dataCadastro: '2026-01-01T00:00:00Z' };
it('preserva data civil, frete e contratos POST/PUT', async () => {
  const mock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(viagem), { status: 201 })).mockResolvedValueOnce(new Response(null, { status: 204 })); vi.stubGlobal('fetch', mock);
  await viagensApi.cadastrar(dados); await expect(viagensApi.atualizar('teste', { ...dados, status: 'Cancelada' })).resolves.toBeUndefined();
  expect(mock.mock.calls[0][0]).toBe('/api/Viagens');
  expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual(dados);
  expect(JSON.parse(mock.mock.calls[1][1].body)).toEqual({ ...dados, status: 'Cancelada' });
  expect(mock.mock.calls[1][1].method).toBe('PUT');
});
it('consulta lista e viagem por URLs relativas', async () => {
  const mock = vi.fn().mockResolvedValueOnce(new Response('[]')).mockResolvedValueOnce(new Response(JSON.stringify(viagem))); vi.stubGlobal('fetch', mock);
  await viagensApi.listar(); await viagensApi.obter('teste');
  expect(mock.mock.calls.map(call => call[0])).toEqual(['/api/Viagens', '/api/Viagens/teste']);
});
it.each([['', null], ['   ', null], ['0', 0], ['1500,50', 1500.5], ['1500.50', 1500.5], ['9999999999,99', 9999999999.99]])('interpreta frete %j sem arredondar', (value, expected) => {
  expect(parseFrete(String(value))).toBe(expected);
});
it.each(['-1', '1.001', 'abc', '1.500,00', '10000000000'])('recusa frete %s', value => expect(() => parseFrete(value)).toThrow());
it('combina periodo inclusivo, situacao e busca sem converter datas por fuso', () => {
  const other = { ...viagem, id: 'outra', dataViagem: '2030-01-03', status: 'Cancelada' };
  expect(filtrarViagens([viagem, other], 'teste01', 'Planejada', '2030-01-02', '2030-01-02')).toEqual([viagem]);
  expect(filtrarViagens([viagem, other], 'ausente', '', '', '')).toEqual([]);
  expect(formatarData('2030-01-02')).toBe('02/01/2030');
  expect(formatarData(null)).toBe('Não informada');
  expect(proximasSituacoes('Concluída')).toEqual([]); expect(proximasSituacoes('Cancelada')).toEqual([]);
});
