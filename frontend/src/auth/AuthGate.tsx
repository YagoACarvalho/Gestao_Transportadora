import { useEffect, useRef, useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { request, HttpError } from '../api/http';
import { sessionEvents, setApiSession } from './session';
import { limparSessaoLocal } from './supabase';
import styles from './AuthGate.module.css';

type View = 'loading' | 'login' | 'checking' | 'ready' | 'forbidden' | 'error';
export function AuthGate({ client, intent = 'login', children }: {
  client: SupabaseClient | null; intent?: 'login' | 'password' | 'invalid-link'; children: (signOut: () => Promise<void>) => ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>('loading');
  const [mode, setMode] = useState<'login' | 'recover' | 'password'>(intent === 'password' ? 'password' : 'login');
  const [error, setError] = useState(intent === 'invalid-link' ? 'O link de acesso é inválido ou expirou. Solicite um novo link.' : '');
  const [feedback, setFeedback] = useState(''); const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [revision, setRevision] = useState(0); const authorized = useRef<string | null>(null);
  const operation = useRef(false);
  const logoutRequested = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [view, mode]);
  useEffect(() => {
    if (!client) { setView('login'); return; }
    let mounted = true;
    let authChanges = 0;
    const accept = (next: Session | null) => {
      if (!mounted || next && logoutRequested.current) return;
      setApiSession(next); setSession(next);
      if (!next) { authorized.current = null; setView('login'); }
      else setView(current => current === 'loading' ? 'login' : current);
    };
    // Callback síncrono: nenhuma chamada Supabase dentro do lock de autenticação.
    const { data: { subscription } } = client.auth.onAuthStateChange((event, next) => {
      if (event !== 'INITIAL_SESSION') authChanges++;
      if (event === 'PASSWORD_RECOVERY') setMode('password');
      accept(next);
    });
    client.auth.getSession().then(({ data, error: failure }) => {
      if (!mounted || authChanges > 0) return;
      if (failure) { setError('Não foi possível recuperar a sessão. Entre novamente.'); accept(null); }
      else accept(data.session);
    }).catch(() => { if (mounted && authChanges === 0) { setError('Não foi possível recuperar a sessão. Entre novamente.'); accept(null); } });
    const accessFailure = (event: Event) => {
      if ((event as CustomEvent<number>).detail === 403) { setApiSession(null); authorized.current = null; setView('forbidden'); }
      else {
        accept(null); setError('Sua sessão expirou. Entre novamente.');
        logoutRequested.current = true;
        void client.auth.signOut({ scope: 'local' }).catch(() => {}).finally(limparSessaoLocal);
      }
    };
    sessionEvents.addEventListener('access-failure', accessFailure);
    return () => { mounted = false; subscription.unsubscribe(); sessionEvents.removeEventListener('access-failure', accessFailure); setApiSession(null); };
  }, [client]);

  useEffect(() => {
    if (!session || mode === 'password') return;
    if (authorized.current === session.user.id) return;
    const controller = new AbortController(); setView('checking'); setError('');
    // Usa contrato existente. Nenhum módulo monta antes de confirmar autorização na API.
    request('/api/Motoristas', { signal: controller.signal }).then(() => {
      if (!controller.signal.aborted) { authorized.current = session.user.id; setView('ready'); }
    }).catch(failure => {
      if (controller.signal.aborted) return;
      if (failure instanceof HttpError && failure.status === 403) setView('forbidden');
      else if (!(failure instanceof HttpError && failure.status === 401)) { setView('error'); setError('Não foi possível confirmar seu acesso. Tente novamente.'); }
    });
    return () => controller.abort();
  }, [session?.user.id, mode, revision]);

  async function signOut() {
    logoutRequested.current = true;
    setBusy(true);
    setApiSession(null); authorized.current = null; setSession(null); setView('login'); setMode('login'); setPassword(''); setConfirm('');
    try { await client?.auth.signOut({ scope: 'local' }); } catch { setError('A sessão local foi encerrada. Não foi possível confirmar a saída no serviço de acesso.'); } finally { limparSessaoLocal(); setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!client || operation.current) return;
    operation.current = true; setBusy(true); setError(''); setFeedback('');
    try {
      if (mode === 'recover') {
        const { error: failure } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/` });
        if (failure) throw failure;
        setFeedback('Se o endereço estiver cadastrado, você receberá as instruções para redefinir a senha.');
      } else if (mode === 'password') {
        if (!session) { setError('O link é inválido ou expirou. Solicite um novo link de recuperação.'); return; }
        if (password !== confirm) { setError('As senhas devem ser iguais.'); return; }
        const { error: failure } = await client.auth.updateUser({ password });
        if (failure) { setError('Não foi possível definir a senha. Confira os requisitos informados pelo administrador ou solicite um novo link.'); return; }
        await signOut(); setFeedback('Senha definida. Entre com seu e-mail e sua senha.');
      } else {
        const { data, error: failure } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (failure || !data.session) { setError('Não foi possível entrar. Confira o e-mail e a senha ou tente novamente.'); return; }
        logoutRequested.current = false; setApiSession(data.session); setSession(data.session); setPassword('');
      }
    } catch { setError('Não foi possível concluir o acesso. Verifique a conexão e tente novamente.'); }
    finally { operation.current = false; setBusy(false); }
  }
  if (view === 'ready' && session && authorized.current === session.user.id && mode !== 'password') return children(signOut);
  const pending = view === 'loading' || view === 'checking';
  const blocked = view === 'forbidden' || view === 'error';
  const title = !client ? 'Acesso em preparação' : pending ? 'Verificando acesso' : view === 'forbidden' ? 'Acesso não autorizado' : view === 'error' ? 'Não foi possível abrir o sistema' : mode === 'password' ? 'Definir senha' : mode === 'recover' ? 'Recuperar senha' : 'Entrar';
  return <main className={styles.page}>
    <section className={styles.identity} aria-label="Gestão de Transportadora"><div className={styles.brand}>Gestão de Transportadora</div><div className={styles.route}><h2>Acesso à operação</h2><p>Cadastros, viagens e despesas da sua transportadora, em um só lugar.</p></div><p>Acesso exclusivo para usuários convidados e autorizados.</p></section>
    <section className={styles.content}><div>
      <h1 ref={heading} tabIndex={-1}>{title}</h1>
      {!client ? <p className={styles.description}>O acesso ainda não foi configurado. Solicite ao responsável a configuração do sistema.</p> : pending ? <p role="status">Verificando sua sessão e sua autorização…</p> : blocked ? <>
        <p className={styles.description}>{view === 'forbidden' ? 'Seu usuário não está autorizado a acessar esta transportadora. Solicite acesso ao responsável.' : 'Não foi possível confirmar a comunicação com o sistema.'}</p>
        {view === 'error' && <button onClick={() => setRevision(v => v + 1)}>Tentar novamente</button>}
        <div className={styles.actions}><button onClick={signOut}>Sair</button></div>
      </> : <>
        <p className={styles.description}>{mode === 'recover' ? 'Informe seu e-mail para receber as instruções.' : mode === 'password' ? 'Defina a senha para acessar sua conta.' : 'Use o e-mail e a senha da sua conta convidada.'}</p>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {mode === 'password' && !session && <p role="alert" className={styles.error}>O link é inválido ou expirou. Solicite um novo link de recuperação.</p>}
        {feedback && <p role="status" className={styles.status}>{feedback}</p>}
        <form onSubmit={submit} className={styles.form}>
          {mode !== 'password' && <div className={styles.field}><label htmlFor="auth-email">E-mail</label><input id="auth-email" type="email" autoComplete="username" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} /></div>}
          {mode !== 'recover' && <div className={styles.field}><label htmlFor="auth-password">{mode === 'password' ? 'Nova senha' : 'Senha'}</label><input id="auth-password" type="password" autoComplete={mode === 'password' ? 'new-password' : 'current-password'} required disabled={busy} value={password} onChange={e => setPassword(e.target.value)} /></div>}
          {mode === 'password' && <div className={styles.field}><label htmlFor="auth-confirm">Confirmar nova senha</label><input id="auth-confirm" type="password" autoComplete="new-password" required disabled={busy} value={confirm} onChange={e => setConfirm(e.target.value)} /></div>}
          <button className={styles.primary} disabled={busy || mode === 'password' && !session}>{busy ? 'Aguarde…' : mode === 'recover' ? 'Enviar instruções' : mode === 'password' ? 'Definir senha' : 'Entrar'}</button>
        </form>
        <div className={styles.actions}><button disabled={busy} onClick={async () => { if (mode === 'password') await signOut(); setMode(mode === 'recover' ? 'login' : 'recover'); setError(''); setFeedback(''); setPassword(''); setConfirm(''); }}>{mode === 'recover' ? 'Voltar para entrar' : mode === 'password' ? 'Solicitar novo link' : 'Esqueci minha senha'}</button></div>
      </>}
    </div></section>
  </main>;
}
