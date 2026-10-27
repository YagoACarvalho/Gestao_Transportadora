import styles from './Sidebar.module.css';

export type Modulo = 'motoristas' | 'caminhoes' | 'viagens' | 'despesas' | 'financeiro';
export function Sidebar({ modulo, onNavigate }: { modulo: Modulo; onNavigate?: () => void }) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">GT</span>
        <span>Gestão de<br />Transportadora</span>
      </div>
      <nav aria-label="Navegação principal" className={styles.navigation}>
        <p className={styles.label}>Cadastros</p>
        <a href="#/motoristas" aria-current={modulo === 'motoristas' ? 'page' : undefined} onClick={onNavigate} className={`${styles.link} ${modulo === 'motoristas' ? styles.active : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg>
          Motoristas
        </a>
        <a href="#/caminhoes" aria-current={modulo === 'caminhoes' ? 'page' : undefined} onClick={onNavigate} className={`${styles.link} ${modulo === 'caminhoes' ? styles.active : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 5h11v12H3zM14 9h4l3 4v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
          Caminhões
        </a>
        <p className={styles.label}>Operação</p>
        <a href="#/viagens" aria-current={modulo === 'viagens' ? 'page' : undefined} onClick={onNavigate} className={`${styles.link} ${modulo === 'viagens' ? styles.active : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M5 7v8a4 4 0 0 0 4 4h8M7 5h8a4 4 0 0 1 4 4v3" /></svg>
          Viagens
        </a>
        <p className={styles.label}>Financeiro</p>
        <a href="#/despesas" aria-current={modulo === 'despesas' ? 'page' : undefined} onClick={onNavigate} className={`${styles.link} ${modulo === 'despesas' ? styles.active : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" /></svg>Despesas</a>
        <a href="#/financeiro" aria-current={modulo === 'financeiro' ? 'page' : undefined} onClick={onNavigate} className={`${styles.link} ${modulo === 'financeiro' ? styles.active : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4v16h17M8 16v-5M13 16V7M18 16V4" /></svg>Resumo financeiro</a>
      </nav>
      <div className={styles.footer}>Organização para<br />cada etapa do transporte.</div>
    </div>
  );
}
