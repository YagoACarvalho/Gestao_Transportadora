import type { Viagem } from './types';
import { formatarData } from './types';
import { moeda } from '../despesas/types';
import { ActionIcon } from '../../components/ActionIcon';
import styles from '../../components/Cadastro.module.css';

export function ViagemDetails({ viagem, onExpense }: { viagem: Viagem; onExpense: () => void }) {
  return <>
    <dl className={styles.details}>
      <div><dt>Origem</dt><dd>{viagem.origem || 'Não informada'}</dd></div>
      <div><dt>Destino</dt><dd>{viagem.destino || 'Não informado'}</dd></div>
      <div><dt>Data da viagem</dt><dd>{formatarData(viagem.dataViagem)}</dd></div>
      <div><dt>Motorista</dt><dd>{viagem.motoristaNome || 'Não informado'}{viagem.motoristaAtivo === false ? ' (inativo)' : ''}</dd></div>
      <div><dt>Caminhão</dt><dd>{viagem.caminhaoPlaca || 'Não informado'}{viagem.caminhaoAtivo === false ? ' (inativo)' : ''}</dd></div>
      <div><dt>Situação</dt><dd>{viagem.status || 'Não informada'}</dd></div>
      <div><dt>Frete previsto</dt><dd>{viagem.valorFrete === null ? 'Não informado' : moeda(viagem.valorFrete)}</dd></div>
      <div><dt>Remuneração automática</dt><dd>{viagem.gerarRemuneracaoAutomatica ? 'Habilitada: 15% do frete, registrada nas despesas.' : 'Não habilitada neste cadastro.'}</dd></div>
    </dl>
    <p>Despesas podem ser lançadas em qualquer fase. Em viagens canceladas, você escolhe sua inclusão no financeiro.</p>
    <div className={styles.actions}><button className={styles.primary} onClick={onExpense}><ActionIcon acao="despesa" />Lançar despesa nesta viagem</button></div>
  </>;
}
