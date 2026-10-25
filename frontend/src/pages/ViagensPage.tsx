import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SidePanel } from '../components/SidePanel';
import { ViagemForm } from '../features/viagens/ViagemForm';
import { ViagensTable } from '../features/viagens/ViagensTable';
import { viagensApi } from '../features/viagens/viagensApi';
import { dadosCompletos, dadosDaViagem, filtrarViagens, proximasSituacoes, situacoes } from '../features/viagens/types';
import type { DadosViagem, SituacaoViagem, Viagem } from '../features/viagens/types';
import { HttpError } from '../api/http';
import styles from '../components/Cadastro.module.css';

export function ViagensPage() {
  const [items, setItems] = useState<Viagem[]>([]);
  const [busca, setBusca] = useState(''); const [status, setStatus] = useState('');
  const [inicio, setInicio] = useState(''); const [fim, setFim] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [feedback, setFeedback] = useState('');
  const [revision, setRevision] = useState(0); const saving = useRef(false);
  const [panel, setPanel] = useState<'create' | 'edit' | 'status' | null>(null);
  const [selected, setSelected] = useState<Viagem>(); const [target, setTarget] = useState<SituacaoViagem>('Planejada');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    viagensApi.listar(controller.signal).then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar viagens.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  async function open(item: Viagem, next?: SituacaoViagem) {
    setBusy(true); setError(''); setFeedback('');
    try {
      const current = await viagensApi.obter(item.id);
      if (next ? !proximasSituacoes(current.status).includes(next) : current.status !== 'Planejada')
        throw new Error('A situação desta viagem mudou. Atualize a lista antes de continuar.');
      setSelected(current); if (next) setTarget(next); setPanel(next ? 'status' : 'edit');
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível consultar a viagem.'); }
    finally { setBusy(false); }
  }
  async function save(body: DadosViagem) {
    if (saving.current) return; saving.current = true; setBusy(true);
    try {
      if (panel === 'edit' && selected) await viagensApi.atualizar(selected.id, { ...body, status: 'Planejada' });
      else await viagensApi.cadastrar(body);
      setFeedback(panel === 'edit' ? 'Alterações salvas.' : 'Viagem cadastrada como planejada.'); setPanel(null); setRevision(v => v + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  async function changeStatus() {
    if (!selected || !dadosCompletos(selected) || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try { await viagensApi.atualizar(selected.id, { ...dadosDaViagem(selected), status: target }); setPanel(null); setFeedback(`Situação da viagem alterada para ${target.toLocaleLowerCase('pt-BR')}.`); setRevision(v => v + 1); }
    catch (failure) { setError(failure instanceof HttpError ? Object.values(failure.fields).flat().join(' ') || failure.message : failure instanceof Error ? failure.message : 'Não foi possível alterar a situação.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const filtered = filtrarViagens(items, busca, status, inicio, fim);
  return <>
    <PageHeader title="Viagens" description="Percursos, equipe e andamento da operação." action={<button className={styles.primary} disabled={busy} onClick={() => { setSelected(undefined); setFeedback(''); setPanel('create'); }}>Cadastrar viagem</button>} />
    <p role="status" className={feedback ? styles.feedback : undefined}>{feedback}</p>
    <section className={styles.workspace} aria-label="Viagens">
      <div className={styles.toolbar}>
        <div className={styles.field}><label htmlFor="busca">Buscar percurso, motorista ou placa</label><input id="busca" type="search" value={busca} onChange={e => setBusca(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor="situacao">Situação</label><select id="situacao" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todas</option>{situacoes.map(s => <option key={s}>{s}</option>)}</select></div>
        <div className={styles.field}><label htmlFor="inicio">Data inicial</label><input id="inicio" type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor="fim">Data final</label><input id="fim" type="date" value={fim} onChange={e => setFim(e.target.value)} /></div>
      </div>
      {inicio && fim && inicio > fim && <p role="alert" className={styles.message}>A data inicial está depois da data final. Ajuste o período.</p>}
      {error && panel !== 'status' && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <button onClick={() => setRevision(v => v + 1)}>Atualizar lista</button></div>}
      {loading ? <p role="status" className={styles.message}>Carregando viagens…</p> : !error && (filtered.length ? <ViagensTable items={filtered} busy={busy} onEdit={item => open(item)} onStatus={open} /> : <p className={styles.message}>Nenhuma viagem encontrada neste filtro.</p>)}
    </section>
    {(panel === 'create' || panel === 'edit') && <SidePanel title={panel === 'create' ? 'Cadastrar viagem' : 'Editar viagem'} busy={busy} onClose={() => setPanel(null)}><ViagemForm viagem={selected} busy={busy} onSave={save} /></SidePanel>}
    {panel === 'status' && selected && <SidePanel title="Alterar situação da viagem" busy={busy} onClose={() => { setPanel(null); setError(''); }}>
      <p>{selected.origem || 'Origem não informada'} para {selected.destino || 'Destino não informado'}</p><p>Alterar de {selected.status || 'Não informada'} para {target}?</p>
      {!dadosCompletos(selected) && <p role="alert">Os dados desta viagem estão incompletos. Revise o cadastro antes de alterar a situação.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.actions}><button disabled={busy} onClick={() => setPanel(null)}>Voltar</button><button className={styles.primary} disabled={busy || !dadosCompletos(selected)} onClick={changeStatus}>{busy ? 'Salvando…' : 'Confirmar alteração'}</button></div>
    </SidePanel>}
  </>;
}
