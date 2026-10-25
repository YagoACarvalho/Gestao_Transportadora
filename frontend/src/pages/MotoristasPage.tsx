import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { motoristasApi } from '../features/motoristas/motoristasApi';
import { filtrarMotoristas } from '../features/motoristas/types';
import type { CriarMotorista, FiltroSituacao, Motorista } from '../features/motoristas/types';
import { MotoristasTable } from '../features/motoristas/MotoristasTable';
import { MotoristaForm } from '../features/motoristas/MotoristaForm';
import { SidePanel } from '../components/SidePanel';
import styles from '../components/Cadastro.module.css';

export function MotoristasPage() {
  const [items, setItems] = useState<Motorista[]>([]);
  const [situacao, setSituacao] = useState<FiltroSituacao>('ativos');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [panel, setPanel] = useState<'create' | 'edit' | 'deactivate' | null>(null);
  const [selected, setSelected] = useState<Motorista>();
  const incluirInativos = situacao !== 'ativos';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    motoristasApi.listar(incluirInativos, controller.signal).then(data => {
      if (!controller.signal.aborted) setItems(data);
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar a lista.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [incluirInativos, revision]);

  async function edit(item: Motorista) {
    setBusy(true); setError(''); setFeedback('');
    try { setSelected(await motoristasApi.obter(item.id)); setPanel('edit'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível abrir o cadastro.'); }
    finally { setBusy(false); }
  }
  async function save(body: CriarMotorista) {
    if (saving.current) return;
    saving.current = true; setBusy(true);
    try {
      if (panel === 'edit' && selected) await motoristasApi.atualizar(selected.id, { ...body, ativo: selected.ativo });
      else await motoristasApi.cadastrar(body);
      setFeedback(panel === 'edit' ? 'Alterações salvas.' : 'Motorista cadastrado como ativo.');
      setPanel(null); setRevision(value => value + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  async function deactivate() {
    if (!selected || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      await motoristasApi.desativar(selected.id);
      setPanel(null); setFeedback('Motorista desativado.'); setRevision(value => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível desativar.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const filtered = filtrarMotoristas(items, busca, situacao);
  return <>
    <PageHeader action={<button className={styles.primary} disabled={busy} onClick={() => { setSelected(undefined); setFeedback(''); setPanel('create'); }}>Cadastrar motorista</button>} />
    <p role="status" aria-live="polite" className={feedback ? styles.feedback : undefined}>{feedback}</p>
    <section aria-label="Cadastro de motoristas" className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.field}><label htmlFor="busca">Buscar por nome, CPF ou CNH</label><input id="busca" type="search" value={busca} onChange={event => setBusca(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="situacao">Situação</label><select id="situacao" value={situacao} onChange={event => setSituacao(event.target.value as FiltroSituacao)}><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option></select></div>
      </div>
      {error && panel !== 'deactivate' && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <button onClick={() => setRevision(value => value + 1)}>Atualizar lista</button></div>}
      {loading ? <p className={styles.message} role="status">Carregando motoristas…</p> : !error && (filtered.length ? <MotoristasTable items={filtered} busy={busy} onEdit={edit} onDeactivate={item => { setSelected(item); setError(''); setFeedback(''); setPanel('deactivate'); }} /> : <p className={styles.message}>{busca ? 'Nenhum resultado para esta busca.' : 'Nenhum motorista encontrado neste filtro.'}</p>)}
    </section>
    {(panel === 'create' || panel === 'edit') && <SidePanel title={panel === 'create' ? 'Cadastrar motorista' : 'Editar motorista'} busy={busy} onClose={() => setPanel(null)}><MotoristaForm motorista={selected} busy={busy} onSave={save} /></SidePanel>}
    {panel === 'deactivate' && selected && <SidePanel title="Desativar motorista" busy={busy} onClose={() => { setPanel(null); setError(''); }}><p>Desativar {selected.nome}? O cadastro será mantido e poderá ser consultado no filtro de inativos.</p>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><button disabled={busy} onClick={() => setPanel(null)}>Cancelar</button><button disabled={busy} onClick={deactivate}>{busy ? 'Desativando…' : 'Desativar motorista'}</button></div></SidePanel>}
  </>;
}
