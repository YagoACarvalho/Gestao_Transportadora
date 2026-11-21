import { Table, TableHeadCell, TableCell } from '../../ui';
import { Badge, Button, LinkButton } from '../../ui';
import { perfilUrl } from '../financeiro/operacao';
import type { Caminhao } from './types';
import styles from '../../components/Cadastro.module.css';
import { ActionIcon } from '../../components/ActionIcon';

export function CaminhoesTable({ items, busy, onEdit, onDeactivate, onReactivate }: { items: Caminhao[]; busy: boolean; onEdit: (item: Caminhao) => void; onDeactivate: (item: Caminhao) => void; onReactivate: (item: Caminhao) => void }) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de caminhões" tabIndex={0}>
    <Table className={styles.table}><caption className={styles.srOnly}>Caminhões encontrados</caption>
      <thead><tr><TableHeadCell scope="col">Placa</TableHeadCell><TableHeadCell scope="col">Modelo</TableHeadCell><TableHeadCell scope="col">Situação</TableHeadCell><TableHeadCell scope="col">Ações</TableHeadCell></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <TableHeadCell scope="row">{item.placa || 'Não informada'}</TableHeadCell><TableCell>{item.modelo || 'Não informado'}</TableCell>
        <TableCell><Badge tone={item.ativo ? 'positive' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
        <TableCell><div className={styles.actions}><LinkButton href={perfilUrl('caminhao', item.id)} aria-label={`Ver perfil do caminhão ${item.placa}`}>Ver perfil</LinkButton><Button variant="secondary" disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar caminhão ${item.placa}`}><ActionIcon acao="editar" />Editar</Button>
          {item.ativo ? <Button variant="secondary" className={styles.danger} disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar caminhão ${item.placa}`}><ActionIcon acao="desativar" />Desativar</Button> : <Button variant="secondary" disabled={busy} onClick={() => onReactivate(item)} aria-label={`Reativar caminhão ${item.placa}`}><ActionIcon acao="reativar" />Reativar</Button>}</div></TableCell>
      </tr>)}</tbody>
    </Table>
  </div>;
}
