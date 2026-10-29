import { Badge, Button, LinkButton } from '../../ui';
import { perfilUrl } from '../financeiro/operacao';
import type { Caminhao } from './types';
import styles from '../../components/Cadastro.module.css';
import { ActionIcon } from '../../components/ActionIcon';

export function CaminhoesTable({ items, busy, onEdit, onDeactivate, onReactivate }: { items: Caminhao[]; busy: boolean; onEdit: (item: Caminhao) => void; onDeactivate: (item: Caminhao) => void; onReactivate: (item: Caminhao) => void }) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de caminhões" tabIndex={0}>
    <table className={styles.table}><caption className={styles.srOnly}>Caminhões encontrados</caption>
      <thead><tr><th scope="col">Placa</th><th scope="col">Modelo</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <th scope="row">{item.placa || 'Não informada'}</th><td>{item.modelo || 'Não informado'}</td>
        <td><Badge tone={item.ativo ? 'positive' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
        <td><div className={styles.actions}><LinkButton href={perfilUrl('caminhao', item.id)} aria-label={`Ver perfil do caminhão ${item.placa}`}>Ver perfil</LinkButton><Button variant="secondary" disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar caminhão ${item.placa}`}><ActionIcon acao="editar" />Editar</Button>
          {item.ativo ? <Button variant="secondary" className={styles.danger} disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar caminhão ${item.placa}`}><ActionIcon acao="desativar" />Desativar</Button> : <Button variant="secondary" disabled={busy} onClick={() => onReactivate(item)} aria-label={`Reativar caminhão ${item.placa}`}><ActionIcon acao="reativar" />Reativar</Button>}</div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
