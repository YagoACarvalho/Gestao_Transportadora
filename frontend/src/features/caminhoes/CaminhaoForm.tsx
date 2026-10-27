import { Button } from '../../ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { HttpError } from '../../api/http';
import type { Caminhao, CriarCaminhao } from './types';
import styles from '../../components/Cadastro.module.css';

export function CaminhaoForm({ caminhao, busy, onSave }: { caminhao?: Caminhao; busy: boolean; onSave: (body: CriarCaminhao & { ativo?: boolean }) => Promise<void> }) {
  const [ativo, setAtivo] = useState(caminhao?.ativo ?? true);
  const [values, setValues] = useState({ placa: caminhao?.placa ?? '', modelo: caminhao?.modelo ?? '' });
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string[]>>({});
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setFields({});
    try { await onSave({ ...values, ...(caminhao ? { ativo } : {}) }); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.');
      if (failure instanceof HttpError) setFields(failure.fields);
    }
  }
  return <form onSubmit={submit} className={styles.form}>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <fieldset disabled={busy}><legend>Identificação do veículo</legend>
      {(['placa', 'modelo'] as const).map(name => {
        const errors = Object.entries(fields).filter(([key]) => key.toLowerCase() === name).flatMap(([, messages]) => messages);
        return <div key={name} className={styles.field}>
          <label htmlFor={name}>{name === 'placa' ? 'Placa' : 'Modelo'}</label>
          <input id={name} name={name} required maxLength={name === 'placa' ? 10 : 100} value={values[name]} aria-invalid={errors.length > 0} aria-describedby={errors.length ? `${name}-error` : undefined} onChange={event => setValues({ ...values, [name]: event.target.value })} />
          {errors.length > 0 && <span id={`${name}-error`} className={styles.error}>{errors.join(' ')}</span>}
        </div>;
      })}
    </fieldset>
    {caminhao ? <fieldset disabled={busy}><legend>Situação</legend><label><input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} /> Cadastro ativo</label><p>Marque para reativar ou desmarque para desativar. O histórico é preservado.</p></fieldset> : <p>O caminhão será cadastrado como ativo.</p>}
    <Button type="submit" disabled={busy}>{busy ? 'Salvando…' : caminhao ? 'Salvar alterações' : 'Cadastrar caminhão'}</Button>
  </form>;
}
