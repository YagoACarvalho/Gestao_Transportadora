import type { Caminhao } from './types';
import styles from '../../components/Cadastro.module.css';
import { ActionIcon } from '../../components/ActionIcon';

export function CaminhoesTable({ items, busy, onEdit, onDeactivate, onReactivate }: { items: Caminhao[]; busy: boolean; onEdit: (item: Caminhao) => void; onDeactivate: (item: Caminhao) => void; onReactivate: (item: Caminhao) => void }) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de caminhões" tabIndex={0}>
    <table className={styles.table}><caption className={styles.srOnly}>Caminhões encontrados</caption>
      <thead><tr><th scope="col">Placa</th><th scope="col">Modelo</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <th scope="row">{item.placa || 'Não informada'}</th><td>{item.modelo || 'Não informado'}</td>
        <td><span className={item.ativo ? styles.active : styles.inactive}>{item.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td><div className={styles.actions}><button disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar caminhão ${item.placa}`}><ActionIcon acao="editar" />Editar</button>
          {item.ativo ? <button className={styles.danger} disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar caminhão ${item.placa}`}><ActionIcon acao="desativar" />Desativar</button> : <button disabled={busy} onClick={() => onReactivate(item)} aria-label={`Reativar caminhão ${item.placa}`}><ActionIcon acao="reativar" />Reativar</button>}</div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
