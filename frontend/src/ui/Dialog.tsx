import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from './index';
import styles from './Dialog.module.css';

/** Port da superfície Leange para dialog nativo, sem providers/servidor Next.js. */
export function Dialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = ref.current; dialog?.showModal();
    return () => { dialog?.close(); opener?.focus(); };
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className={styles.header}><h2 id={id}>{title}</h2><Button variant="secondary" disabled={busy} onClick={onClose}>Fechar</Button></header>
    <div className={styles.body}>{children}</div>
  </dialog>;
}
