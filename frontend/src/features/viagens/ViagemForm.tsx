import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { HttpError } from '../../api/http';
import { motoristasApi } from '../motoristas/motoristasApi';
import { caminhoesApi } from '../caminhoes/caminhoesApi';
import type { Motorista } from '../motoristas/types';
import type { Caminhao } from '../caminhoes/types';
import { parseFrete } from './types';
import type { DadosViagem, Viagem } from './types';
import styles from '../../components/Cadastro.module.css';

export function ViagemForm({ viagem, busy, onSave }: { viagem?: Viagem; busy: boolean; onSave: (body: DadosViagem) => Promise<void> }) {
  const [values, setValues] = useState({ origem: viagem?.origem ?? '', destino: viagem?.destino ?? '', dataViagem: viagem?.dataViagem ?? '', motoristaId: viagem?.motoristaId ?? '', caminhaoId: viagem?.caminhaoId ?? '', frete: viagem?.valorFrete?.toString().replace('.', ',') ?? '' });
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string[]>>({});
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setLookupError('');
    Promise.all([motoristasApi.listar(false, controller.signal), caminhoesApi.listar(false, controller.signal)]).then(([m, c]) => {
      if (!controller.signal.aborted) { setMotoristas(m); setCaminhoes(c); }
    }).catch(failure => { if (!controller.signal.aborted) setLookupError(failure instanceof Error ? failure.message : 'Não foi possível carregar os vínculos.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const fieldError = (name: string) => Object.entries(fields).filter(([key]) => key.toLowerCase() === name.toLowerCase()).flatMap(([, messages]) => messages).join(' ');
  const input = (name: 'origem' | 'destino' | 'dataViagem', label: string, type = 'text') => <div className={styles.field}>
    <label htmlFor={name}>{label} (obrigatório)</label><input id={name} required type={type} maxLength={type === 'text' ? 150 : undefined} value={values[name]} aria-invalid={!!fieldError(name)} aria-describedby={fieldError(name) ? `${name}-error` : undefined} onChange={event => setValues({ ...values, [name]: event.target.value })} />
    {fieldError(name) && <span id={`${name}-error`} className={styles.error}>{fieldError(name)}</span>}
  </div>;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setFields({});
    try { await onSave({ origem: values.origem, destino: values.destino, dataViagem: values.dataViagem, motoristaId: values.motoristaId, caminhaoId: values.caminhaoId, valorFrete: parseFrete(values.frete) }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.'); if (failure instanceof HttpError) setFields(failure.fields); }
  }
  return <form className={styles.form} onSubmit={submit}>
    {loading && <p role="status">Carregando motoristas e caminhões…</p>}
    {lookupError && <div role="alert">{lookupError} <button type="button" onClick={() => setRevision(v => v + 1)}>Tentar carregar vínculos</button></div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!loading && !lookupError && !motoristas.length && !viagem?.motoristaId && <p>Nenhum motorista ativo disponível. Cadastre um motorista antes de criar a viagem.</p>}
    {!loading && !lookupError && !caminhoes.length && !viagem?.caminhaoId && <p>Nenhum caminhão ativo disponível. Cadastre um caminhão antes de criar a viagem.</p>}
    <fieldset disabled={busy || loading || !!lookupError}><legend>Percurso</legend>{input('origem', 'Origem')}{input('destino', 'Destino')}{input('dataViagem', 'Data da viagem', 'date')}</fieldset>
    <fieldset disabled={busy || loading || !!lookupError}><legend>Equipe e veículo</legend>
      <div className={styles.field}><label htmlFor="motoristaId">Motorista (obrigatório)</label>
        <select id="motoristaId" required value={values.motoristaId} aria-invalid={!!fieldError('motoristaId')} aria-describedby="motorista-ajuda" onChange={event => setValues({ ...values, motoristaId: event.target.value })}>
          <option value="">Selecione um motorista</option>
          {viagem?.motoristaId && !motoristas.some(m => m.id === viagem.motoristaId) && <option value={viagem.motoristaId}>{viagem.motoristaNome || 'Vínculo atual'} (mantido do cadastro)</option>}
          {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select><span id="motorista-ajuda">{fieldError('motoristaId') || 'Novos vínculos exigem motorista ativo.'}</span>
      </div>
      <div className={styles.field}><label htmlFor="caminhaoId">Caminhão (obrigatório)</label>
        <select id="caminhaoId" required value={values.caminhaoId} aria-invalid={!!fieldError('caminhaoId')} aria-describedby="caminhao-ajuda" onChange={event => setValues({ ...values, caminhaoId: event.target.value })}>
          <option value="">Selecione um caminhão</option>
          {viagem?.caminhaoId && !caminhoes.some(c => c.id === viagem.caminhaoId) && <option value={viagem.caminhaoId}>{viagem.caminhaoPlaca || 'Vínculo atual'} (mantido do cadastro)</option>}
          {caminhoes.map(c => <option key={c.id} value={c.id}>{c.placa} — {c.modelo}</option>)}
        </select><span id="caminhao-ajuda">{fieldError('caminhaoId') || 'Novos vínculos exigem caminhão ativo.'}</span>
      </div>
    </fieldset>
    <fieldset disabled={busy}><legend>Frete</legend><div className={styles.field}><label htmlFor="frete">Valor do frete (opcional)</label><input id="frete" inputMode="decimal" value={values.frete} aria-invalid={!!fieldError('valorFrete')} aria-describedby="frete-ajuda" onChange={event => setValues({ ...values, frete: event.target.value })} /><span id="frete-ajuda">{fieldError('valorFrete') || 'Valor não negativo, com até duas casas decimais. Exemplo de formato: 1500,50.'}</span></div></fieldset>
    <p>A viagem {viagem ? 'permanece planejada ao salvar os dados' : 'será cadastrada como planejada'}.</p>
    <button type="submit" className={styles.primary} disabled={busy || loading || !!lookupError}>{busy ? 'Salvando…' : viagem ? 'Salvar alterações' : 'Cadastrar viagem'}</button>
  </form>;
}
