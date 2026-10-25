import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sidebar } from '../components/Sidebar';
import { MotoristasPage } from '../pages/MotoristasPage';
import { CaminhoesPage } from '../pages/CaminhoesPage';
import { ViagensPage } from '../pages/ViagensPage';
import styles from './AppShell.module.css';

export function AppShell() {
  const readModulo = () => window.location.hash === '#/viagens' ? 'viagens' as const : window.location.hash === '#/caminhoes' ? 'caminhoes' as const : 'motoristas' as const;
  const [modulo, setModulo] = useState(readModulo);
  const main = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const closeMenu = () => dialog.current?.close();
  const title = modulo === 'viagens' ? 'Viagens' : modulo === 'caminhoes' ? 'Caminhões' : 'Motoristas';
  useEffect(() => {
    const navigate = () => { if (window.location.hash !== '#conteudo') setModulo(readModulo()); };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.title = `${title} | Gestão de Transportadora`;
    main.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#conteudo" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Ir para o conteúdo</a>
      <aside className={styles.desktopSidebar}><Sidebar modulo={modulo} /></aside>
      <div className={styles.main}>
        <div className={styles.topbar}>
          <motion.button whileTap={reduceMotion ? undefined : { scale: 0.97 }} ref={menuButton} className={styles.menuButton} type="button" aria-haspopup="dialog" aria-controls="menu-movel" onClick={() => dialog.current?.showModal()}>Menu</motion.button>
          <span>{modulo === 'viagens' ? 'Operação' : 'Cadastros'} <span className={styles.separator} aria-hidden="true">/</span> <strong>{title}</strong></span>
        </div>
        <main ref={main} id="conteudo" tabIndex={-1} className={styles.content}>
          {modulo === 'viagens' ? <ViagensPage /> : modulo === 'caminhoes' ? <CaminhoesPage /> : <MotoristasPage />}
        </main>
        <footer className={styles.footer}>Gestão de Transportadora</footer>
      </div>
      <dialog id="menu-movel" ref={dialog} className={styles.dialog} aria-label="Menu principal" onClose={() => menuButton.current?.focus()} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
        <div className={styles.mobilePanel}>
          <button autoFocus type="button" className={styles.closeButton} onClick={closeMenu}>Fechar menu</button>
          <Sidebar modulo={modulo} onNavigate={closeMenu} />
        </div>
      </dialog>
    </div>
  );
}
