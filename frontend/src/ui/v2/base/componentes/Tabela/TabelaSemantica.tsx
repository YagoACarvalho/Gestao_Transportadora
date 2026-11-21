import type { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import styles from './Tabela.module.css';
import { juntarClasses } from '../../utilitarios';

/** Integra as tabelas existentes sem reconstruir linhas, cálculos ou ações. */
export function TabelaSemantica({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <div className={styles.moldura} data-densidade="padrao"><div className={styles.rolagem}><table {...props} className={juntarClasses(styles.tabela, className)} /></div></div>;
}
export function CabecalhoSemantico({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={juntarClasses(props.scope === 'row' ? styles.celula : styles.cabecalho, className)} />;
}
export function CelulaSemantica({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={juntarClasses(styles.celula, className)} />;
}
