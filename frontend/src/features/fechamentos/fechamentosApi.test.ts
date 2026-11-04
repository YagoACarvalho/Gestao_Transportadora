import { expect, it, vi } from 'vitest';
import { fechamentosApi } from './fechamentosApi';
import type { FiltrosFechamento } from './fechamentosApi';
it('envia filtros e versão ao backend sem enviar totais ou consultar outras rotas', async () => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response('{}')); vi.stubGlobal('fetch', fetchMock);
  const filtros: FiltrosFechamento = { dataInicial: '2026-10-01', dataFinal: '2026-10-31', motoristaId: null, caminhaoId: null, situacoes: ['Concluída'], categoria: null, incluirDespesasGerais: false };
  await fechamentosApi.previa(filtros);
  const pedido = { titulo: 'Acerto', filtros, versaoPrevia: 'A'.repeat(64), chaveRequisicao: '11111111-1111-4111-8111-111111111111' };
  await fechamentosApi.salvar(pedido);
  expect(fetchMock.mock.calls[0][0]).toBe('/api/fechamentos/previa');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(filtros);
  expect(fetchMock.mock.calls[1][0]).toBe('/api/fechamentos');
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(pedido);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('usa paginação na listagem e consulta o acerto por identificação', async () => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response('{}')); vi.stubGlobal('fetch', fetchMock);
  await fechamentosApi.listar(2); await fechamentosApi.detalhes('acerto-1');
  expect(fetchMock.mock.calls[0][0]).toBe('/api/fechamentos?pagina=2&tamanhoPagina=20');
  expect(fetchMock.mock.calls[1][0]).toBe('/api/fechamentos/acerto-1');
});
