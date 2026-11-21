import { StrictMode } from 'react';
import '@fontsource-variable/inter';
import { createRoot } from 'react-dom/client';
import { AppShell } from './app/AppShell';
import { AuthGate } from './auth/AuthGate';
import { getSupabaseClient, readAuthIntent } from './auth/supabase';
import './styles/tokens.css';
import './styles/global.css';
import { initializeTheme } from './ui/theme';
initializeTheme();
const intent = readAuthIntent();
const client = getSupabaseClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthGate client={client} intent={intent}>{signOut => <AppShell onSignOut={signOut} />}</AuthGate>
  </StrictMode>,
);
