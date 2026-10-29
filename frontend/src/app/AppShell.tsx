import { Button, ThemeSelector } from '../ui';
import { useEffect, useRef, useState } from 'react';
import { AppShell as UiAppShell } from '../ui';
import { Sidebar } from '../components/Sidebar';
import type { Modulo } from '../components/Sidebar';
import { MotoristasPage } from '../pages/MotoristasPage';
import { MotoristaPerfilPage } from '../pages/MotoristaPerfilPage';
import type { AbaMotorista } from '../pages/MotoristaPerfilPage';
import { CaminhoesPage } from '../pages/CaminhoesPage';
import { CaminhaoPerfilPage } from '../pages/CaminhaoPerfilPage';
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
  const parametros = new URLSearchParams(consulta);
  const motoristaId = modulo === 'motoristas' ? parametros.get('motoristaId') : null;
  const caminhaoId = modulo === 'caminhoes' ? parametros.get('caminhaoId') : null;
  const periodoPerfil = `${parametros.get('inicio') ?? ''}-${parametros.get('fim') ?? ''}`;
  const abaInformada = parametros.get('aba');
  const abaMotorista: AbaMotorista = abaInformada === 'viagens' || abaInformada === 'remuneracao' || abaInformada === 'resumo' ? abaInformada : 'cadastro';
  const main = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = () => dialog.current?.close();
  const title = motoristaId ? 'Perfil do motorista' : caminhaoId ? 'Perfil do caminhão' : { viagens: 'Viagens', caminhoes: 'Caminhões', motoristas: 'Motoristas', despesas: 'Despesas', financeiro: 'Resumo financeiro' }[modulo];
  useEffect(() => {
    const navigate = () => { if (window.location.hash !== '#conteudo') { setModulo(readModulo()); setConsulta(window.location.hash.split('?')[1] ?? ''); } };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.title = `${title} | Gestão de Transportadora`;
    main.current?.focus({ preventScroll: true });
  }, [title, motoristaId, caminhaoId]);

  return (
    <UiAppShell className={styles.shell}>
      <a className={styles.skip} href="#conteudo" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Ir para o conteúdo</a>
      <aside className={styles.desktopSidebar}><Sidebar modulo={modulo} /></aside>
      <div className={styles.main}>
        <div className={styles.topbar}>
          <Button variant="secondary" ref={menuButton} className={styles.menuButton} type="button" aria-haspopup="dialog" aria-controls="menu-movel" onClick={() => dialog.current?.showModal()}>☰ Menu</Button>
          <span className={styles.breadcrumb}><span className={styles.context}>{modulo === 'viagens' ? 'Operação' : modulo === 'despesas' || modulo === 'financeiro' ? 'Financeiro' : 'Cadastros'}</span><span className={styles.separator} aria-hidden="true">/</span><strong>{title}</strong></span>
          <div className={styles.themeActions}><ThemeSelector />{onSignOut && <Button variant="secondary" onClick={onSignOut}>Sair</Button>}</div>
        </div>
        <main ref={main} id="conteudo" tabIndex={-1} className={styles.content}>
          {modulo === 'viagens' ? <ViagensPage /> : modulo === 'caminhoes' ? caminhaoId ? <CaminhaoPerfilPage key={`${caminhaoId}-${periodoPerfil}`} caminhaoId={caminhaoId} /> : <CaminhoesPage /> : modulo === 'despesas' ? <DespesasPage key={consulta} /> : modulo === 'financeiro' ? <FinanceiroPage /> : motoristaId ? <MotoristaPerfilPage key={`${motoristaId}-${periodoPerfil}`} motoristaId={motoristaId} aba={abaMotorista} /> : <MotoristasPage />}
        </main>
        <footer className={styles.footer}><span>Gestão de Transportadora</span><span>Cadastros, operação e financeiro</span></footer>
      </div>
      <dialog id="menu-movel" ref={dialog} className={styles.dialog} aria-label="Menu principal" onClose={() => menuButton.current?.focus()} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
        <div className={styles.mobilePanel}>
          <Button variant="secondary" autoFocus type="button" className={styles.closeButton} onClick={closeMenu}>Fechar menu</Button>
          <Sidebar modulo={modulo} onNavigate={closeMenu} />
        </div>
      </dialog>
    </UiAppShell>
  );
}
