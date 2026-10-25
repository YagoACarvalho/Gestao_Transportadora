import { dadosCompletos, formatarData, proximasSituacoes } from './types';
import type { SituacaoViagem, Viagem } from './types';
import styles from '../../components/Cadastro.module.css';
export function ViagensTable({ items, busy, onEdit, onStatus }: { items: Viagem[]; busy: boolean; onEdit: (item: Viagem) => void; onStatus: (item: Viagem, status: SituacaoViagem) => void }) {
  return <div className={styles.tableScroll} role="region" aria-label="Lista de viagens" tabIndex={0}>
    <table className={styles.table}><caption className={styles.srOnly}>Viagens encontradas</caption><thead><tr>
      <th scope="col">Percurso</th><th scope="col">Data</th><th scope="col">Motorista / Caminhão</th><th scope="col">Frete</th><th scope="col">Situação</th><th scope="col">Ações</th>
    </tr></thead><tbody>{items.map(item => <tr key={item.id}>
      <th scope="row">{item.origem || 'Origem não informada'}<span className={styles.secondary}>Destino: {item.destino || 'Não informado'}</span></th>
      <td>{formatarData(item.dataViagem)}</td>
      <td>{item.motoristaNome || 'Motorista não informado'}{item.motoristaAtivo === false && <span className={styles.secondary}>Motorista inativo</span>}<span className={styles.secondary}>{item.caminhaoPlaca || 'Caminhão não informado'}{item.caminhaoAtivo === false ? ' (inativo)' : ''}</span></td>
      <td>{item.valorFrete === null ? 'Não informado' : item.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>{item.status || 'Não informada'}</td><td><div className={styles.actions}>
        {item.status === 'Planejada' && <button disabled={busy} onClick={() => onEdit(item)} aria-label={`Editar viagem ${item.origem || 'sem origem'}`}>Editar</button>}
        {proximasSituacoes(item.status).filter(status => status === 'Cancelada' || dadosCompletos(item)).map(status => <button key={status} disabled={busy} onClick={() => onStatus(item, status)} aria-label={`${status === 'Cancelada' ? 'Cancelar' : status === 'Concluída' ? 'Concluir' : 'Iniciar'} viagem ${item.origem}`}>{status === 'Cancelada' ? 'Cancelar' : status === 'Concluída' ? 'Concluir' : 'Iniciar'}</button>)}
      </div>{!dadosCompletos(item) && <span className={styles.secondary}>Dados incompletos</span>}</td>
    </tr>)}</tbody></table>
  </div>;
}
