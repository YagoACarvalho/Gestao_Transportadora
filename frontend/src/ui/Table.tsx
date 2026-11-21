import type { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import styles from './leange/src/components/ui/data-table/data-table.module.css';
const join = (...names: (string | undefined)[]) => names.filter(Boolean).join(' ');
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} className={join(styles.table, className)} style={{ '--line-subtle': 'var(--color-border)', '--line-faint': 'var(--color-border)', ...props.style } as React.CSSProperties} />;
}
export function TableHeadCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={join(props.scope === 'row' ? styles.cell : styles.th, className)} />;
}
export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={join(styles.cell, className)} />;
}
