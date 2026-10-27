import type { ReactNode } from 'react';
import { Avatar, Card } from './index';
import styles from './PersonCard.module.css';

export function PersonCard({ name, badge, details, actions }: {
  name: string; badge: ReactNode; details: { label: string; value: ReactNode }[]; actions: ReactNode;
}) {
  return <Card span={4} aria-label={name} className={styles.card}>
    <div className={styles.identity}><Avatar name={name} /><div><h3>{name}</h3>{badge}</div></div>
    <dl className={styles.details}>{details.map(detail => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
    <div className={styles.actions}>{actions}</div>
  </Card>;
}
