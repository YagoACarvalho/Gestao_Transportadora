import { Table, TableHeadCell, TableCell } from '../../ui';
import { Badge, Button, Avatar } from '../../ui';
import { formatarDataCivil } from './types';
import type { Motorista } from './types';
import styles from '../../components/Cadastro.module.css';
import { ActionIcon } from '../../components/ActionIcon';
export function MotoristasTable({ items, busy, onEdit, onDeactivate, onReactivate }: {
  items: Motorista[]; busy: boolean; onEdit: (item: Motorista) => void; onDeactivate: (item: Motorista) => void; onReactivate: (item: Motorista) => void;
}) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de motoristas" tabIndex={0}>
    <Table className={styles.table}><caption className={styles.srOnly}>Motoristas encontrados</caption>
      <thead><tr><TableHeadCell scope="col">Motorista</TableHeadCell><TableHeadCell scope="col">CNH / Categoria</TableHeadCell><TableHeadCell scope="col">Validade da CNH</TableHeadCell><TableHeadCell scope="col">Situação</TableHeadCell><TableHeadCell scope="col">Ações</TableHeadCell></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <TableHeadCell scope="row"><div className={styles.person}><Avatar name={item.nome || 'Motorista'} /><div>{item.nome}<span className={styles.secondary}>{item.telefone || 'Telefone não informado'}</span></div></div></TableHeadCell>
        <TableCell>{item.numeroCnh || 'Não informada'}<span className={styles.secondary}>{item.categoriaCnh || 'Categoria não informada'}</span></TableCell>
        <TableCell>{formatarDataCivil(item.dataValidadeCnh)}</TableCell><TableCell><Badge tone={item.ativo ? 'positive' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
        <TableCell><div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar ${item.nome}`}><ActionIcon acao="editar" />Editar</Button>
          {item.ativo ? <Button variant="secondary" className={styles.danger} disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar ${item.nome}`}><ActionIcon acao="desativar" />Desativar</Button> : <Button variant="secondary" disabled={busy} onClick={() => onReactivate(item)} aria-label={`Reativar ${item.nome}`}><ActionIcon acao="reativar" />Reativar</Button>}</div></TableCell>
      </tr>)}</tbody></Table>
  </div>;
}
