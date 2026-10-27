import { Badge, Button, Avatar } from '../../ui';
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
        <th scope="row"><div className={styles.person}><Avatar name={item.nome || 'Motorista'} /><div>{item.nome}<span className={styles.secondary}>{item.telefone || 'Telefone não informado'}</span></div></div></th>
        <td>{item.numeroCnh || 'Não informada'}<span className={styles.secondary}>{item.categoriaCnh || 'Categoria não informada'}</span></td>
        <td>{formatarDataCivil(item.dataValidadeCnh)}</td><td><Badge tone={item.ativo ? 'positive' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
        <td><div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar ${item.nome}`}><ActionIcon acao="editar" />Editar</Button>
          {item.ativo ? <Button variant="secondary" className={styles.danger} disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar ${item.nome}`}><ActionIcon acao="desativar" />Desativar</Button> : <Button variant="secondary" disabled={busy} onClick={() => onReactivate(item)} aria-label={`Reativar ${item.nome}`}><ActionIcon acao="reativar" />Reativar</Button>}</div></td>
      </tr>)}</tbody></table>
  </div>;
}
