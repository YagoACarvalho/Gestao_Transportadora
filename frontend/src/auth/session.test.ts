import { afterEach, expect, it, vi } from 'vitest';
import { request } from '../api/http';
import { setApiSession } from './session';
import { readAuthIntent } from './supabase';
afterEach(() => { setApiSession(null); window.history.replaceState(null, '', '/'); });
it('troca de usuario limpa ETags para impedir reaproveitamento de versoes', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response('{}', { headers: { ETag: '"versao-usuario-a"' } })).mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock); setApiSession({ access_token: 'token-a-teste', user: { id: 'a' } });
  await request('/api/Motoristas/versao-sessao'); setApiSession({ access_token: 'token-b-teste', user: { id: 'b' } });
  await request('/api/Motoristas/versao-sessao', { method: 'PUT' });
  const headers = new Headers(fetchMock.mock.calls[1][1].headers); expect(headers.has('If-Match')).toBe(false); expect(headers.get('Authorization')).toBe('Bearer token-b-teste');
});
it('logout aborta requisicoes e descarta respostas tardias', async () => {
  let resolve!: (value: Response) => void;
  const fetchMock = vi.fn((_path: RequestInfo | URL, _options?: RequestInit) => new Promise<Response>(r => { resolve = r; })); vi.stubGlobal('fetch', fetchMock);
  setApiSession({ access_token: 'token-teste', user: { id: 'usuario' } });
  const pending = request('/api/Motoristas'); setApiSession(null); resolve(new Response('[{"nome":"NAO_EXIBIR"}]'));
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
});
it('nao envia token para endereco externo', async () => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); setApiSession({ access_token: 'token-teste', user: { id: 'usuario' } });
  await expect(request('https://outro.invalid/api')).rejects.toThrow('Endereço de API inválido.'); expect(fetchMock).not.toHaveBeenCalled();
});
it('reconhece convite e recuperacao sem confundir rotas hash; remove erros da URL', () => {
  window.history.replaceState(null, '', '/#type=invite&access_token=token-teste'); expect(readAuthIntent()).toBe('password');
  window.history.replaceState(null, '', '/#type=recovery'); expect(readAuthIntent()).toBe('password');
  window.history.replaceState(null, '', '/#/viagens'); expect(readAuthIntent()).toBe('login');
  window.history.replaceState(null, '', '/#error=access_denied&error_description=DETALHE_TESTE'); expect(readAuthIntent()).toBe('invalid-link'); expect(window.location.hash).toBe('');
});
