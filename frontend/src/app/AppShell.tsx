import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppShell as UiAppShell } from '../ui';
import { Sidebar } from '../components/Sidebar';
import type { Modulo } from '../components/Sidebar';
import { MotoristasPage } from '../pages/MotoristasPage';
import { CaminhoesPage } from '../pages/CaminhoesPage';
import { ViagensPage } from '../pages/ViagensPage';
import { DespesasPage } from '../pages/DespesasPage';
import { FinanceiroPage } from '../pages/FinanceiroPage';
import styles from './AppShell.module.css';

export function AppShell({ onSignOut }: { onSignOut?: () => Promise<void> }) {
  const readModulo = (): Modulo => {
    const value = window.location.hash.slice(2).split('?')[0];
    return value === 'viagens' || value === 'caminhoes' || value === 'despesas' || value === 'financeiro' ? value : 'motoristas';
  };
  const [modulo, setModulo] = useState(readModulo);
  const [consulta, setConsulta] = useState(() => window.location.hash.split('?')[1] ?? '');
  const main = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const closeMenu = () => dialog.current?.close();
  const title = { viagens: 'Viagens', caminhoes: 'Caminhões', motoristas: 'Motoristas', despesas: 'Despesas', financeiro: 'Resumo financeiro' }[modulo];
  useEffect(() => {
    const navigate = () => { if (window.location.hash !== '#conteudo') { setModulo(readModulo()); setConsulta(window.location.hash.split('?')[1] ?? ''); } };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.title = `${title} | Gestão de Transportadora`;
    main.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <UiAppShell className={styles.shell}>
      <a className={styles.skip} href="#conteudo" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Ir para o conteúdo</a>
      <aside className={styles.desktopSidebar}><Sidebar modulo={modulo} /></aside>
      <div className={styles.main}>
        <div className={styles.topbar}>
          <motion.button whileTap={reduceMotion ? undefined : { scale: 0.97 }} ref={menuButton} className={styles.menuButton} type="button" aria-haspopup="dialog" aria-controls="menu-movel" onClick={() => dialog.current?.showModal()}>Menu</motion.button>
          <span>{modulo === 'viagens' ? 'Operação' : modulo === 'despesas' || modulo === 'financeiro' ? 'Financeiro' : 'Cadastros'} <span className={styles.separator} aria-hidden="true">/</span> <strong>{title}</strong></span>
          {onSignOut && <button className={styles.signOut} onClick={onSignOut}>Sair</button>}
        </div>
        <main ref={main} id="conteudo" tabIndex={-1} className={styles.content}>
          {modulo === 'viagens' ? <ViagensPage /> : modulo === 'caminhoes' ? <CaminhoesPage /> : modulo === 'despesas' ? <DespesasPage key={consulta} /> : modulo === 'financeiro' ? <FinanceiroPage /> : <MotoristasPage />}
        </main>
        <footer className={styles.footer}>Gestão de Transportadora</footer>
      </div>
      <dialog id="menu-movel" ref={dialog} className={styles.dialog} aria-label="Menu principal" onClose={() => menuButton.current?.focus()} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
        <div className={styles.mobilePanel}>
          <button autoFocus type="button" className={styles.closeButton} onClick={closeMenu}>Fechar menu</button>
          <Sidebar modulo={modulo} onNavigate={closeMenu} />
        </div>
      </dialog>
    </UiAppShell>
  );
}
