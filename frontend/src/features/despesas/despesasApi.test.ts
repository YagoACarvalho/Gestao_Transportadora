import { expect, it, vi } from 'vitest';
import { despesasApi } from './despesasApi';
import { parseValor } from './types';
it('preserva contratos, data civil e valor no POST/PUT e usa DELETE sem corpo', async () => {
  const mock = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 201 })).mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal('fetch', mock);
  const body = { descricao: 'Teste', categoria: 'Teste', valor: 12.5, dataDespesa: '2030-01-02', viagemId: null };
  await despesasApi.cadastrar(body); await despesasApi.atualizar('teste', body); await despesasApi.excluir('teste');
  expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual(body); expect(mock.mock.calls[1][1].method).toBe('PUT');
  expect(mock.mock.calls[2]).toEqual(['/api/Despesas/teste', { method: 'DELETE' }]);
});
it.each(['', '-1', '0', '1.001', '10000000000', 'abc'])('recusa valor %j', value => expect(() => parseValor(value)).toThrow());
it('interpreta valor sem conversao de moeda ou arredondamento silencioso', () => expect(parseValor('12,50')).toBe(12.5));
