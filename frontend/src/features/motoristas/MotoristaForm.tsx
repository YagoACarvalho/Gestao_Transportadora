import { Button } from '../../ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { HttpError } from '../../api/http';
import type { CriarMotorista, Motorista } from './types';
import styles from '../../components/Cadastro.module.css';
export function MotoristaForm({ motorista, busy, onSave }: { motorista?: Motorista; busy: boolean; onSave: (body: CriarMotorista & { ativo?: boolean }) => Promise<void> }) {
  const [ativo, setAtivo] = useState(motorista?.ativo ?? true);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [values, setValues] = useState({ nome: motorista?.nome ?? '', cpf: motorista?.cpf ?? '', numeroCnh: motorista?.numeroCnh ?? '', categoriaCnh: motorista?.categoriaCnh ?? '', dataValidadeCnh: motorista?.dataValidadeCnh ?? '', telefone: motorista?.telefone ?? '' });
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setFields({});
    const cpf = values.cpf.replace(/[.\-\s]/g, '') || null;
    try { await onSave({ nome: values.nome, cpf, numeroCnh: values.numeroCnh || null, categoriaCnh: values.categoriaCnh || null, dataValidadeCnh: values.dataValidadeCnh || null, telefone: values.telefone || null, ...(motorista ? { ativo } : {}) }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.'); if (failure instanceof HttpError) setFields(failure.fields); }
  }
  const field = (name: keyof typeof values, label: string, type = 'text') => {
    const errors = Object.entries(fields).filter(([key]) => key.toLowerCase() === name.toLowerCase()).flatMap(([, messages]) => messages);
    const limits = { nome: 150, cpf: 14, numeroCnh: 20, categoriaCnh: 5, telefone: 20, dataValidadeCnh: undefined };
    return <div className={styles.field}><label htmlFor={name}>{label}{name === 'nome' ? ' (obrigatório)' : ''}</label>
      <input id={name} name={name} type={type} maxLength={limits[name]} value={values[name]} required={name === 'nome'} aria-invalid={errors.length > 0} aria-describedby={errors.length ? `${name}-error` : undefined} onChange={event => setValues({ ...values, [name]: event.target.value })} />
      {errors.length > 0 && <span id={`${name}-error`} className={styles.error}>{errors.join(' ')}</span>}</div>;
  };
  return <form onSubmit={submit} className={styles.form}>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <fieldset disabled={busy}><legend>Identificação</legend>{field('nome', 'Nome')}{field('cpf', 'CPF')}</fieldset>
    <fieldset disabled={busy}><legend>Habilitação</legend>{field('numeroCnh', 'Número da CNH')}{field('categoriaCnh', 'Categoria da CNH')}{field('dataValidadeCnh', 'Validade da CNH', 'date')}</fieldset>
    <fieldset disabled={busy}><legend>Contato</legend>{field('telefone', 'Telefone', 'tel')}</fieldset>
    {motorista ? <fieldset disabled={busy}><legend>Situação</legend><label><input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} /> Cadastro ativo</label><p>Marque para reativar ou desmarque para desativar. O histórico é preservado.</p></fieldset> : <p>O motorista será cadastrado como ativo.</p>}
    <Button type="submit" disabled={busy}>{busy ? 'Salvando…' : motorista ? 'Salvar alterações' : 'Cadastrar motorista'}</Button>
  </form>;
}
