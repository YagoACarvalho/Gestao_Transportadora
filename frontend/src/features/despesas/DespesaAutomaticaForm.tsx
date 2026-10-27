import { useState } from 'react';
import type { FormEvent } from 'react';
import { moeda } from './types';
import type { Despesa } from './types';
import { formatarData } from '../viagens/types';
import styles from '../../components/Cadastro.module.css';

export function DespesaAutomaticaForm({ despesa, busy, onSave }: { despesa: Despesa; busy: boolean; onSave: (incluir: boolean) => Promise<void> }) {
  const [incluir, setIncluir] = useState(despesa.considerarNoFinanceiro !== false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try { await onSave(incluir); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível salvar a situação financeira.'); }
  }
  return <form className={styles.form} onSubmit={submit}>
    <p>Remuneração automática: 15% do frete da viagem. Altere o frete na viagem para recalcular o valor.</p>
    <dl><dt>Valor previsto</dt><dd>{moeda(despesa.valor ?? 0)}</dd><dt>Data da viagem</dt><dd>{formatarData(despesa.dataDespesa)}</dd></dl>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <fieldset disabled={busy}><legend>Situação financeira</legend><div className={styles.field}>
      <label htmlFor="incluir-automatica">Incluir no financeiro</label><select id="incluir-automatica" value={incluir ? 'sim' : 'nao'} onChange={event => setIncluir(event.target.value === 'sim')}>
        <option value="sim">Sim, considerar nos totais</option><option value="nao">Não, preservar apenas no histórico</option>
      </select><span>Este lançamento não confirma pagamento ao motorista.</span>
    </div></fieldset>
    <button className={styles.primary} disabled={busy}>{busy ? 'Salvando…' : 'Salvar situação financeira'}</button>
  </form>;
}
