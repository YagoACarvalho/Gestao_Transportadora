import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { AuthGate } from './AuthGate';
import { apiSession, setApiSession } from './session';

const session = { access_token: 'token-exclusivo-teste', user: { id: 'usuario-teste' } } as Session;
function fixture(initial: Session | null = null) {
  let listener: (event: AuthChangeEvent, next: Session | null) => void = () => {};
  const emit = (event: AuthChangeEvent, next: Session | null) => listener(event, next);
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: initial }, error: null })),
    onAuthStateChange: vi.fn((callback: typeof listener) => { listener = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
    signInWithPassword: vi.fn(async () => { emit('SIGNED_IN', session); return { data: { session }, error: null }; }),
    signOut: vi.fn(async () => { emit('SIGNED_OUT', null); return { error: null }; }),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    updateUser: vi.fn(async () => ({ data: { user: session.user }, error: null })),
  };
  return { auth, emit, client: { auth } as unknown as SupabaseClient };
}
function renderGate(client: SupabaseClient | null, intent: 'login' | 'password' = 'login') {
  return render(<AuthGate client={client} intent={intent}>{signOut => <><h1>Operação autorizada</h1><button onClick={signOut}>Sair da operação</button></>}</AuthGate>);
}
afterEach(() => { setApiSession(null); window.sessionStorage.removeItem('gt.auth.session'); });
it('nao monta operacao nem consulta API sem configuracao ou sessao', async () => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  const { unmount } = renderGate(null); await screen.findByRole('heading', { name: 'Acesso em preparação' }); expect(fetchMock).not.toHaveBeenCalled();
  unmount(); renderGate(fixture().client); await screen.findByRole('button', { name: 'Entrar' });
  expect(screen.queryByText('Operação autorizada')).toBeNull(); expect(fetchMock).not.toHaveBeenCalled();
});
it('entra e monta a operacao somente apos autorizacao na API', async () => {
  const { client, auth } = fixture(); const fetchMock = vi.fn(async (_path: RequestInfo | URL, _options?: RequestInit) => new Response('[]')); vi.stubGlobal('fetch', fetchMock);
  renderGate(client); await screen.findByRole('button', { name: 'Entrar' });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'teste@example.invalid' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-exclusiva-teste' } }); fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  await screen.findByText('Operação autorizada'); expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'teste@example.invalid', password: 'senha-exclusiva-teste' });
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe(`Bearer ${session.access_token}`);
});
it('mantem dados de negocio ocultos quando a API retorna 403', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 403 })));
  renderGate(fixture(session).client); await screen.findByRole('heading', { name: 'Acesso não autorizado' });
  expect(screen.queryByText('Operação autorizada')).toBeNull(); expect(apiSession().token).toBeNull();
});
it('sessao expirada retorna ao login sem expor token ou corpo da API', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('DETALHE_INTERNO_TESTE', { status: 401 })));
  renderGate(fixture(session).client); await screen.findByText('Sua sessão expirou. Entre novamente.');
  expect(screen.queryByText('Operação autorizada')).toBeNull(); expect(screen.queryByText('DETALHE_INTERNO_TESTE')).toBeNull(); expect(apiSession().token).toBeNull();
});
it('recupera falha temporaria sem abrir a operacao antes da confirmacao', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(new Response('[]')));
  renderGate(fixture(session).client); await screen.findByRole('button', { name: 'Tentar novamente' });
  expect(screen.queryByText('Operação autorizada')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Operação autorizada');
});
it('recuperacao usa URL da aplicacao e nao confirma existencia do email', async () => {
  const { client, auth } = fixture(); renderGate(client); await screen.findByRole('button', { name: 'Esqueci minha senha' });
  fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'teste@example.invalid' } }); fireEvent.click(screen.getByRole('button', { name: 'Enviar instruções' }));
  await screen.findByText(/Se o endereço estiver cadastrado/); expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('teste@example.invalid', { redirectTo: `${window.location.origin}/` });
});
it('convite define senha e exige novo login, sem montar a operacao', async () => {
  const { client, auth } = fixture(session); const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  renderGate(client, 'password'); await screen.findByRole('heading', { name: 'Definir senha' });
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'nova-senha-teste' } });
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'nova-senha-teste' } }); fireEvent.click(screen.getByRole('button', { name: 'Definir senha' }));
  await screen.findByText('Senha definida. Entre com seu e-mail e sua senha.'); expect(auth.updateUser).toHaveBeenCalledWith({ password: 'nova-senha-teste' }); expect(fetchMock).not.toHaveBeenCalled(); expect(apiSession().token).toBeNull();
});
it('link expirado nao oferece acesso nem envia nova senha sem sessao', async () => {
  const { client, auth } = fixture(); renderGate(client, 'password');
  await screen.findByText('O link é inválido ou expirou. Solicite um novo link de recuperação.');
  expect((screen.getByRole('button', { name: 'Definir senha' }) as HTMLButtonElement).disabled).toBe(true); expect(auth.updateUser).not.toHaveBeenCalled();
});
it('logout limpa armazenamento e nao restaura operacao mesmo se o provedor falhar', async () => {
  const { client, auth, emit } = fixture(session); auth.signOut.mockRejectedValue(new Error('offline'));
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]'))); window.sessionStorage.setItem('gt.auth.session', 'sessao-ficticia-teste');
  renderGate(client); await screen.findByText('Operação autorizada'); fireEvent.click(screen.getByRole('button', { name: 'Sair da operação' }));
  await screen.findByRole('button', { name: 'Entrar' }); await waitFor(() => expect(window.sessionStorage.getItem('gt.auth.session')).toBeNull());
  act(() => emit('TOKEN_REFRESHED', session)); expect(screen.queryByText('Operação autorizada')).toBeNull(); expect(apiSession().token).toBeNull();
});
it('renovacao de token do mesmo usuario preserva a tela e troca de usuario verifica novo acesso', async () => {
  const { client, emit } = fixture(session); const fetchMock = vi.fn(async () => new Response('[]')); vi.stubGlobal('fetch', fetchMock);
  renderGate(client); await screen.findByText('Operação autorizada');
  act(() => emit('TOKEN_REFRESHED', { ...session, access_token: 'token-renovado-teste' }));
  expect(screen.getByText('Operação autorizada')).toBeTruthy(); expect(fetchMock).toHaveBeenCalledTimes(1); expect(apiSession().token).toBe('token-renovado-teste');
  act(() => emit('SIGNED_IN', { ...session, access_token: 'outro-token-teste', user: { ...session.user, id: 'outro-usuario-teste' } }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
});
