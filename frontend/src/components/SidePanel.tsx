import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './Cadastro.module.css';
export function SidePanel({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); opener?.focus(); };
  }, []);
  return <dialog ref={dialog} className={styles.panel} aria-labelledby="panel-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className={styles.panelHeader}><h2 id="panel-title">{title}</h2><button type="button" disabled={busy} onClick={onClose}>Fechar</button></div>{children}
  </dialog>;
}
