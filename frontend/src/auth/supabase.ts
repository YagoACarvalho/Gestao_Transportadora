import { createClient } from '@supabase/supabase-js';
const storageKey = 'gt.auth.session';
export function limparSessaoLocal() {
  window.sessionStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(`${storageKey}-code-verifier`);
}
export function readAuthIntent(): 'login' | 'password' | 'invalid-link' {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.has('error') || params.has('error_code')) {
    window.history.replaceState(null, '', window.location.pathname);
    return 'invalid-link';
  }
  return params.get('type') === 'invite' || params.get('type') === 'recovery' ? 'password' : 'login';
}
export function getSupabaseClient() {
  const url: string | undefined = import.meta.env.VITE_SUPABASE_URL;
  const key: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith('sb_publishable_')) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) return null;
    return createClient(url, key, { auth: { storage: window.sessionStorage, storageKey,
      persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });
  } catch { return null; }
}
