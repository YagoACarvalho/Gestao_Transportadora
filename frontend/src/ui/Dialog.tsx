import type { ReactNode } from 'react';
import { Modal } from './v2/base';
import { Button } from './index';
import styles from './Dialog.module.css';
export function Dialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  return <Modal aberto onFechar={() => { if (!busy) onClose(); }} rotulo={title} tamanho="grande" fecharAoClicarFora={false} fecharComEsc={!busy}>
    <header className={styles.header}><h2>{title}</h2><Button variant="secondary" disabled={busy} onClick={onClose}>Fechar</Button></header>
    <div className={styles.body} data-corpo-modal>{children}</div>
  </Modal>;
}
