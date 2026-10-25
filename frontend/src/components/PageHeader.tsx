import styles from './PageHeader.module.css';
import type { ReactNode } from 'react';

export function PageHeader({ title = 'Motoristas', description = 'Os profissionais que movimentam sua operação.', action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
