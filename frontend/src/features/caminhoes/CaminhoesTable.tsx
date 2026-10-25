import type { Caminhao } from './types';
import styles from '../../components/Cadastro.module.css';

export function CaminhoesTable({ items, busy, onEdit, onDeactivate }: { items: Caminhao[]; busy: boolean; onEdit: (item: Caminhao) => void; onDeactivate: (item: Caminhao) => void }) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de caminhões" tabIndex={0}>
    <table className={styles.table}><caption className={styles.srOnly}>Caminhões encontrados</caption>
      <thead><tr><th scope="col">Placa</th><th scope="col">Modelo</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <th scope="row">{item.placa || 'Não informada'}</th><td>{item.modelo || 'Não informado'}</td>
        <td><span className={item.ativo ? styles.active : styles.inactive}>{item.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td><div className={styles.actions}><button disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar caminhão ${item.placa}`}>Editar</button>
          {item.ativo && <button disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar caminhão ${item.placa}`}>Desativar</button>}</div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
