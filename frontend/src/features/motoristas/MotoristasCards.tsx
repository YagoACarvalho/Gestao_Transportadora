import { Badge, Button, Grid, LinkButton } from '../../ui';
import { PersonCard } from '../../ui/PersonCard';
import { ActionIcon } from '../../components/ActionIcon';
import { formatarDataCivil } from './types';
import type { Motorista } from './types';
import styles from './PerfilMotorista.module.css';
import cadastro from '../../components/Cadastro.module.css';

export function MotoristasCards({ items, busy, onEdit, onDeactivate, onReactivate }: {
  items: Motorista[]; busy: boolean; onEdit: (item: Motorista) => void;
  onDeactivate: (item: Motorista) => void; onReactivate: (item: Motorista) => void;
}) {
  return <div className={styles.cards}><Grid>{items.map(item => <PersonCard key={item.id} name={item.nome || 'Nome não informado'}
    badge={<Badge tone={item.ativo ? 'positive' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge>}
    details={[
      { label: 'Telefone', value: item.telefone || 'Não informado' },
      { label: 'Categoria da CNH', value: item.categoriaCnh || 'Não informada' },
      { label: 'Validade da CNH', value: formatarDataCivil(item.dataValidadeCnh) },
    ]}
    actions={<>
      <LinkButton variant="primary" href={`#/motoristas?motoristaId=${encodeURIComponent(item.id)}`} aria-label={`Ver perfil de ${item.nome}`}><ActionIcon acao="detalhes" />Ver perfil</LinkButton>
      <LinkButton href={`#/motoristas?motoristaId=${encodeURIComponent(item.id)}&aba=viagens`} aria-label={`Ver viagens de ${item.nome}`}>Viagens</LinkButton>
      <Button variant="secondary" disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar ${item.nome}`}><ActionIcon acao="editar" />Editar</Button>
      {item.ativo ? <Button variant="secondary" className={cadastro.danger} disabled={busy} onClick={() => onDeactivate(item)} aria-label={`Desativar ${item.nome}`}><ActionIcon acao="desativar" />Desativar</Button>
        : <Button variant="secondary" disabled={busy} onClick={() => onReactivate(item)} aria-label={`Reativar ${item.nome}`}><ActionIcon acao="reativar" />Reativar</Button>}
    </>} />)}</Grid></div>;
}
