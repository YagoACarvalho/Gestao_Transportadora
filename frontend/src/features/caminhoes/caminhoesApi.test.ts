import { expect, it, vi } from 'vitest';
import { caminhoesApi } from './caminhoesApi';
import { filtrarCaminhoes } from './types';
import type { Caminhao } from './types';

const item: Caminhao = { id: 'teste', placa: 'TESTE01', modelo: 'Modelo teste', ativo: true, dataCadastro: '2026-01-01T00:00:00Z' };
it('envia POST sem alterar formato ou caixa da placa', async () => {
  const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify(item), { status: 201 })); vi.stubGlobal('fetch', mock);
  await caminhoesApi.cadastrar({ placa: 'abc-1234', modelo: 'Modelo teste' });
  expect(mock).toHaveBeenCalledWith('/api/Caminhoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placa: 'abc-1234', modelo: 'Modelo teste' }) });
});
it('preserva Ativo explicitamente no PUT e aceita 204', async () => {
  const mock = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal('fetch', mock);
  await expect(caminhoesApi.atualizar('teste', { placa: 'TESTE01', modelo: 'Editado', ativo: false })).resolves.toBeUndefined();
  expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual({ placa: 'TESTE01', modelo: 'Editado', ativo: false });
  expect(mock.mock.calls[0][1].method).toBe('PUT');
});
it('usa os contratos de listagem, consulta e desativacao', async () => {
  const mock = vi.fn().mockResolvedValueOnce(new Response('[]')).mockResolvedValueOnce(new Response(JSON.stringify(item))).mockResolvedValueOnce(new Response(null, { status: 204 })); vi.stubGlobal('fetch', mock);
  await caminhoesApi.listar(true); await caminhoesApi.obter('teste'); await caminhoesApi.desativar('teste');
  expect(mock.mock.calls[0][0]).toBe('/api/Caminhoes?incluirInativos=true');
  expect(mock.mock.calls[1][0]).toBe('/api/Caminhoes/teste');
  expect(mock.mock.calls[2]).toEqual(['/api/Caminhoes/teste', { method: 'DELETE' }]);
});
it('combina busca por placa ou modelo com situacao', () => {
  const inativo = { ...item, id: 'inativo', placa: 'ZZZ0001', ativo: false };
  expect(filtrarCaminhoes([item, inativo], 'teste01', 'todos')).toEqual([item]);
  expect(filtrarCaminhoes([item, inativo], 'MODELO', 'inativos')).toEqual([inativo]);
  expect(filtrarCaminhoes([item, inativo], '', 'ativos')).toEqual([item]);
  expect(filtrarCaminhoes([item], 'ausente', 'todos')).toEqual([]);
});
