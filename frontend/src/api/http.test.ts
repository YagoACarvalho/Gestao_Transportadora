import { expect, it, vi } from 'vitest';
import { request } from './http';

it('envia a versao lida no PUT e mantem o conflito recuperavel', async () => {
  const mock = vi.fn().mockResolvedValueOnce(new Response('{}', { headers: { ETag: '"versao-teste"' } }))
    .mockResolvedValueOnce(new Response(null, { status: 409 }));
  vi.stubGlobal('fetch', mock);
  await request('/api/Motoristas/conflito-teste');
  await expect(request('/api/Motoristas/conflito-teste', { method: 'PUT', body: '{}' })).rejects.toMatchObject({ status: 409 });
  expect(new Headers(mock.mock.calls[1][1].headers).get('If-Match')).toBe('"versao-teste"');
});

it('envia versao na exclusao e descarta depois do sucesso', async () => {
  const mock = vi.fn().mockResolvedValueOnce(new Response('{}', { headers: { ETag: '"versao-despesa"' } }))
    .mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', mock);
  await request('/api/Despesas/conflito-teste');
  await request('/api/Despesas/conflito-teste', { method: 'DELETE' });
  expect(new Headers(mock.mock.calls[1][1].headers).get('If-Match')).toBe('"versao-despesa"');
  await request('/api/Despesas/conflito-teste', { method: 'DELETE' });
  expect(new Headers(mock.mock.calls[2][1].headers).has('If-Match')).toBe(false);
});

it('envia no PATCH financeiro o ETag da despesa e descarta apos salvar', async () => {
  const mock = vi.fn().mockResolvedValueOnce(new Response('{}', { headers: { ETag: '"versao-financeira"' } }))
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', mock);
  await request('/api/Despesas/automatica-teste');
  await request('/api/Despesas/automatica-teste/situacao-financeira', { method: 'PATCH', body: '{"considerarNoFinanceiro":false}' });
  expect(new Headers(mock.mock.calls[1][1].headers).get('If-Match')).toBe('"versao-financeira"');
  await request('/api/Despesas/automatica-teste/situacao-financeira', { method: 'PATCH', body: '{"considerarNoFinanceiro":true}' });
  expect(new Headers(mock.mock.calls[2][1].headers).has('If-Match')).toBe(false);
});
