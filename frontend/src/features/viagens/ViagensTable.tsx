import { dadosCompletos, formatarData, proximasSituacoes, semSituacao } from './types';
import type { SituacaoViagem, Viagem } from './types';
import styles from '../../components/Cadastro.module.css';
import { ActionIcon } from '../../components/ActionIcon';
import { Badge, Button } from '../../ui';

function acaoSituacao(atual: string | null, proxima: SituacaoViagem) {
  if (proxima === 'Planejada') return { texto: 'Reabrir', icone: 'reativar' as const };
  if (proxima === 'Cancelada') return { texto: 'Cancelar', icone: 'cancelar' as const };
  if (proxima === 'Concluída') return { texto: 'Concluir', icone: 'concluir' as const };
  if (proxima === 'Pausada') return { texto: 'Pausar', icone: 'pausar' as const };
  return { texto: atual === 'Pausada' ? 'Retomar' : 'Iniciar', icone: 'iniciar' as const };
}
export function ViagensTable({ items, busy, onEdit, onStatus, onDetails, onExpense }: { items: Viagem[]; busy: boolean; onEdit: (item: Viagem) => void; onStatus: (item: Viagem, status: SituacaoViagem) => void; onDetails: (item: Viagem) => void; onExpense: (item: Viagem) => void }) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de viagens" tabIndex={0}>
    <table className={styles.table}><caption className={styles.srOnly}>Viagens encontradas</caption><thead><tr>
      <th scope="col">Percurso e andamento</th><th scope="col">Data</th><th scope="col">Motorista / Caminhão</th><th scope="col">Frete</th><th scope="col">Ações</th>
    </tr></thead><tbody>{items.map(item => <tr key={item.id}>
      <th scope="row">{item.origem || 'Origem não informada'}<span className={styles.secondary}>Destino: {item.destino || 'Não informado'}</span><div className={styles.tripStatus}><Badge tone={item.status === 'Pausada' ? 'warning' : item.status === 'Concluída' ? 'positive' : item.status === 'Cancelada' ? 'negative' : 'neutral'}>{item.status || 'Não informada'}</Badge></div>
      <div className={styles.actions} role="group" aria-label={`Andamento da viagem ${item.origem || 'sem origem'}`}>
        {semSituacao(item.status) && <Button variant="secondary" disabled={busy} onClick={() => onEdit(item)} icon={<ActionIcon acao="editar" />} aria-label={`Regularizar viagem ${item.origem || 'sem origem'}`}>Regularizar viagem</Button>}
        {proximasSituacoes(item.status).map(status => {
          const acao = acaoSituacao(item.status, status);
          return <Button variant="secondary" key={status} className={status === 'Cancelada' ? styles.danger : undefined} disabled={busy || status !== 'Cancelada' && !dadosCompletos(item)} onClick={() => onStatus(item, status)} aria-label={`${acao.texto} viagem ${item.origem}`} icon={<ActionIcon acao={acao.icone} />}>{acao.texto}</Button>;
        })}
      </div>{!dadosCompletos(item) && proximasSituacoes(item.status).some(status => status !== 'Cancelada') && <span className={styles.secondary}>Complete os dados obrigatórios para iniciar, pausar, retomar ou reabrir.</span>}
      {!proximasSituacoes(item.status).length && !semSituacao(item.status) && <span className={styles.secondary}>Situação não reconhecida. Alteração indisponível.</span>}</th>
      <td>{formatarData(item.dataViagem)}</td>
      <td>{item.motoristaNome || 'Motorista não informado'}{item.motoristaAtivo === false && <span className={styles.secondary}>Motorista inativo</span>}<span className={styles.secondary}>{item.caminhaoPlaca || 'Caminhão não informado'}{item.caminhaoAtivo === false ? ' (inativo)' : ''}</span></td>
      <td>{item.valorFrete === null ? 'Não informado' : item.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td><div className={styles.actions}>
        <Button variant="secondary" disabled={busy} onClick={() => onDetails(item)} aria-label={`Ver detalhes da viagem ${item.origem || 'sem origem'}`}><ActionIcon acao="detalhes" />Ver detalhes</Button>
        <Button variant="secondary" disabled={busy} onClick={() => onExpense(item)} aria-label={`Lançar despesa na viagem ${item.origem || 'sem origem'}`}><ActionIcon acao="despesa" />Lançar despesa</Button>
        {item.status === 'Planejada' && <Button variant="secondary" disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar viagem ${item.origem || 'sem origem'}`}><ActionIcon acao="editar" />Editar</Button>}

      </div>{!dadosCompletos(item) && <span className={styles.secondary}>Dados incompletos</span>}</td>
    </tr>)}</tbody></table>
  </div>;
}
