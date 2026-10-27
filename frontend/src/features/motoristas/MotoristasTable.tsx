import { formatarDataCivil } from './types';
import type { Motorista } from './types';
import styles from '../../components/Cadastro.module.css';
import { ActionIcon } from '../../components/ActionIcon';
export function MotoristasTable({ items, busy, onEdit, onDeactivate, onReactivate }: {
  items: Motorista[]; busy: boolean; onEdit: (item: Motorista) => void; onDeactivate: (item: Motorista) => void; onReactivate: (item: Motorista) => void;
}) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de motoristas" tabIndex={0}>
    <table className={styles.table}><caption className={styles.srOnly}>Motoristas encontrados</caption>
      <thead><tr><th scope="col">Motorista</th><th scope="col">CNH / Categoria</th><th scope="col">Validade da CNH</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <th scope="row">{item.nome}<span className={styles.secondary}>{item.telefone || 'Telefone não informado'}</span></th>
        <td>{item.numeroCnh || 'Não informada'}<span className={styles.secondary}>{item.categoriaCnh || 'Categoria não informada'}</span></td>
        <td>{formatarDataCivil(item.dataValidadeCnh)}</td><td><span className={item.ativo ? styles.active : styles.inactive}>{item.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td><div className={styles.actions}><button disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar ${item.nome}`}><ActionIcon acao="editar" />Editar</button>
          {item.ativo ? <button className={styles.danger} disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar ${item.nome}`}><ActionIcon acao="desativar" />Desativar</button> : <button disabled={busy} onClick={() => onReactivate(item)} aria-label={`Reativar ${item.nome}`}><ActionIcon acao="reativar" />Reativar</button>}</div></td>
      </tr>)}</tbody></table>
  </div>;
}
