import { Button } from '../../ui';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { HttpError } from '../../api/http';
import { viagensApi } from '../viagens/viagensApi';
import { caminhoesApi } from '../caminhoes/caminhoesApi';
import type { Caminhao } from '../caminhoes/types';
import { formatarData } from '../viagens/types';
import type { Viagem } from '../viagens/types';
import { parseValor } from './types';
import type { DadosDespesa, Despesa } from './types';
import styles from '../../components/Cadastro.module.css';

export function DespesaForm({ despesa, viagemInicial, tipoInicial = 'geral', busy, onSave }: { despesa?: Despesa; viagemInicial?: Viagem; tipoInicial?: 'geral' | 'viagem'; busy: boolean; onSave: (body: DadosDespesa) => Promise<void> }) {
  const [tipo, setTipo] = useState<'geral' | 'viagem'>(despesa ? (despesa.viagemId ? 'viagem' : 'geral') : tipoInicial);
  const [situacaoFinanceira, setSituacaoFinanceira] = useState(despesa ? (despesa.considerarNoFinanceiro === false ? 'nao' : 'sim') : '');
  const [values, setValues] = useState({ descricao: despesa?.descricao ?? '', categoria: despesa?.categoria ?? '',
    valor: despesa?.valor?.toString().replace('.', ',') ?? '', dataDespesa: despesa?.dataDespesa ?? '', viagemId: despesa?.viagemId ?? viagemInicial?.id ?? '' });
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [caminhaoId, setCaminhaoId] = useState(despesa?.caminhaoId ?? '');
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [carregandoCaminhoes, setCarregandoCaminhoes] = useState(false);
  const [erroCaminhoes, setErroCaminhoes] = useState('');
  const [loading, setLoading] = useState(true); const [lookupError, setLookupError] = useState('');
  const [revision, setRevision] = useState(0); const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (tipo !== 'geral') return;
    const controller = new AbortController(); setCarregandoCaminhoes(true); setErroCaminhoes('');
    caminhoesApi.listar(true, controller.signal).then(items => {
      if (!controller.signal.aborted) setCaminhoes(items.filter(c => c.ativo || c.id === despesa?.caminhaoId));
    }).catch(() => { if (!controller.signal.aborted) setErroCaminhoes('Não foi possível carregar caminhões.'); })
      .finally(() => { if (!controller.signal.aborted) setCarregandoCaminhoes(false); });
    return () => controller.abort();
  }, [tipo, revision, despesa?.caminhaoId]);
  useEffect(() => {
    if (tipo === 'geral') { setLoading(false); return; }
    const controller = new AbortController(); setLoading(true); setLookupError('');
    viagensApi.listar(controller.signal).then(items => { if (!controller.signal.aborted) setViagens(items); })
      .catch(failure => { if (!controller.signal.aborted) setLookupError(failure instanceof Error ? failure.message : 'Não foi possível carregar viagens.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision, tipo]);
  const fieldError = (name: string) => Object.entries(fields).filter(([key]) => key.toLowerCase() === name.toLowerCase()).flatMap(([, messages]) => messages).join(' ');
  const viagemCancelada = tipo === 'viagem' && viagens.some(v => v.id === values.viagemId && v.status === 'Cancelada');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setFields({});
    if (tipo === 'viagem' && !values.viagemId) { setError('Selecione a viagem desta despesa.'); return; }
    if (!despesa && viagemCancelada && !situacaoFinanceira) { setError('Escolha se a despesa entra no financeiro.'); return; }
    try { await onSave({ ...values, viagemId: tipo === 'viagem' ? values.viagemId : null, caminhaoId: tipo === 'geral' ? caminhaoId || null : null, valor: parseValor(values.valor),
      ...(despesa || viagemCancelada ? { considerarNoFinanceiro: situacaoFinanceira === 'sim' } : {}) }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.'); if (failure instanceof HttpError) setFields(failure.fields); }
  }
  return <form onSubmit={submit} className={styles.form}>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <fieldset disabled={busy}><legend>Lançamento</legend>
      <div className={styles.field}><label htmlFor="tipoDespesa">Tipo de despesa</label>
        <select id="tipoDespesa" value={tipo} onChange={e => setTipo(e.target.value as 'geral' | 'viagem')}>
          <option value="geral">Despesa geral</option><option value="viagem">Despesa de viagem</option>
        </select>
        <span>{tipo === 'geral' ? 'Custo da transportadora sem vínculo com uma viagem.' : 'Custo vinculado à viagem selecionada abaixo.'}</span>
      </div>
      {(['descricao', 'categoria', 'dataDespesa', 'valor'] as const).map(name => <div className={styles.field} key={name}>
        <label htmlFor={name}>{{ descricao: 'Descrição', categoria: 'Categoria', dataDespesa: 'Data da despesa', valor: 'Valor' }[name]} (obrigatório)</label>
        <input id={name} required type={name === 'dataDespesa' ? 'date' : 'text'} inputMode={name === 'valor' ? 'decimal' : undefined}
          maxLength={name === 'descricao' ? 200 : name === 'categoria' ? 50 : undefined} value={values[name]}
          aria-invalid={!!fieldError(name)} aria-describedby={fieldError(name) ? `${name}-error` : name === 'valor' ? 'valor-ajuda' : undefined}
          onChange={e => setValues({ ...values, [name]: e.target.value })} />
        {fieldError(name) && <span id={`${name}-error`} className={styles.error}>{fieldError(name)}</span>}
      </div>)}
      <span id="valor-ajuda">Valor maior que zero, com até duas casas decimais.</span>
    </fieldset>
    {tipo === 'geral' && <fieldset disabled={busy}><legend>Caminhão</legend>
      {carregandoCaminhoes && <p role="status">Carregando caminhões…</p>}
      {erroCaminhoes && <p role="alert">{erroCaminhoes} <Button variant="secondary" type="button" onClick={() => setRevision(v => v + 1)}>Carregar caminhões novamente</Button></p>}
      <div className={styles.field}><label htmlFor="caminhaoId">Caminhão (opcional)</label>
        <select id="caminhaoId" value={caminhaoId} disabled={carregandoCaminhoes || !!erroCaminhoes} onChange={e => setCaminhaoId(e.target.value)} aria-invalid={!!fieldError('caminhaoId')} aria-describedby="caminhao-ajuda">
          <option value="">Sem vínculo com caminhão</option>
          {caminhaoId && !caminhoes.some(c => c.id === caminhaoId) && <option value={caminhaoId}>{despesa?.caminhao?.placa || 'Vínculo atual'}</option>}
          {caminhoes.map(c => <option key={c.id} value={c.id}>{c.placa} · {c.modelo}{!c.ativo ? ' (inativo)' : ''}</option>)}
        </select><span id="caminhao-ajuda">{fieldError('caminhaoId') || 'Associe este custo a um caminhão, sem vincular a uma viagem.'}</span>
      </div>
    </fieldset>}
    {tipo === 'viagem' && <fieldset disabled={busy}><legend>Viagem</legend>
      {loading && <p role="status">Carregando viagens…</p>}
      {lookupError && <div role="alert">{lookupError} <Button variant="secondary" type="button" onClick={() => setRevision(v => v + 1)}>Carregar viagens novamente</Button></div>}
      <div className={styles.field}><label htmlFor="viagemId">Viagem (obrigatório)</label>
        <select id="viagemId" required value={values.viagemId} disabled={loading || !!lookupError} aria-invalid={!!fieldError('viagemId')} aria-describedby="viagem-ajuda" onChange={e => { setValues({ ...values, viagemId: e.target.value }); if (!despesa) setSituacaoFinanceira(''); }}>
          <option value="">Selecione uma viagem</option>
          {values.viagemId && !viagens.some(v => v.id === values.viagemId) && <option value={values.viagemId}>Vínculo atual</option>}
          {viagens.map(v => <option key={v.id} value={v.id}>{v.origem || 'Origem não informada'} → {v.destino || 'Destino não informado'} · {formatarData(v.dataViagem)} · {v.status || 'Situação não informada'} · {v.id.slice(0, 8)}</option>)}
        </select><span id="viagem-ajuda">{fieldError('viagemId') || 'Você pode lançar despesas em qualquer fase da viagem, inclusive após conclusão ou cancelamento.'}</span>
      </div>
    </fieldset>}
    {(despesa || viagemCancelada) && <fieldset disabled={busy}><legend>Situação financeira</legend><div className={styles.field}>
      <label htmlFor="considerarNoFinanceiro">Incluir no financeiro (obrigatório)</label>
      <select id="considerarNoFinanceiro" required value={situacaoFinanceira} onChange={e => setSituacaoFinanceira(e.target.value)} aria-describedby="situacao-financeira-ajuda">
        <option value="">Selecione uma opção</option><option value="sim">Sim, considerar nos totais</option><option value="nao">Não, preservar apenas no histórico</option>
      </select><span id="situacao-financeira-ajuda">{fieldError('considerarNoFinanceiro') || 'Desconsiderar não apaga o lançamento. Você pode incluí-lo novamente pela edição.'}</span>
    </div></fieldset>}
    <Button type="submit" disabled={busy || tipo === 'viagem' && (loading || !!lookupError)}>{busy ? 'Salvando…' : despesa ? 'Salvar alterações' : 'Cadastrar despesa'}</Button>
  </form>;
}
