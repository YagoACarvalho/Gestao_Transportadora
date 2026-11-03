import { afterEach, expect, it, vi } from 'vitest';
import { fretesApi } from './fretesApi';
import { entradaInicial } from './simulacao';
import { setApiSession } from '../../auth/session';

afterEach(() => setApiSession(null));
it('envia contrato por URL relativa com token apenas no cabeçalho', async () => {
  setApiSession({ access_token: 'token-ficticio', user: { id: 'teste' } });
  const mock = vi.fn().mockResolvedValue(new Response('{}')); vi.stubGlobal('fetch', mock);
  const e = entradaInicial('2026-10-01'); await fretesApi.calcular(e, new AbortController().signal);
  expect(mock.mock.calls[0][0]).toBe('/api/fretes/calcular');
  const options = mock.mock.calls[0][1] as RequestInit;
  expect(new Headers(options.headers).get('Authorization')).toBe('Bearer token-ficticio');
  expect(JSON.parse(String(options.body))).toEqual(e); expect(String(options.body)).not.toContain('token-ficticio');
});
it('preserva mensagem de domínio em falha do provedor', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: { mapas: ['Endereço ambíguo. Escolha uma sugestão.'] } }), { status: 400 })));
  await expect(fretesApi.sugerir('teste', new AbortController().signal)).rejects.toThrow('Endereço ambíguo');
});
it('traduz limite de taxa sem tratar como sessão inválida', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
  await expect(fretesApi.opcoes()).rejects.toThrow('Aguarde um minuto');
});
it('busca imagens pelo cliente autenticado e aceita corpo binário', async () => {
  setApiSession({ access_token: 'token-ficticio', user: { id: 'teste' } });
  const mock = vi.fn().mockResolvedValue(new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } })); vi.stubGlobal('fetch', mock);
  const blob = await fretesApi.tile(5, 11, 17, new AbortController().signal);
  expect(blob.size).toBe(4); expect(mock.mock.calls[0][0]).toBe('/api/fretes/mapa-tiles/5/11/17');
  expect(new Headers(mock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token-ficticio');
});
