import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { caminhoesApi } from '../features/caminhoes/caminhoesApi';
import { filtrarCaminhoes } from '../features/caminhoes/types';
import type { CriarCaminhao, FiltroSituacao, Caminhao } from '../features/caminhoes/types';
import { CaminhoesTable } from '../features/caminhoes/CaminhoesTable';
import { CaminhaoForm } from '../features/caminhoes/CaminhaoForm';
import { SidePanel } from '../components/SidePanel';
import styles from '../components/Cadastro.module.css';

export function CaminhoesPage() {
  const [items, setItems] = useState<Caminhao[]>([]);
  const [situacao, setSituacao] = useState<FiltroSituacao>('ativos');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [panel, setPanel] = useState<'create' | 'edit' | 'deactivate' | null>(null);
  const [selected, setSelected] = useState<Caminhao>();
  const incluirInativos = situacao !== 'ativos';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    caminhoesApi.listar(incluirInativos, controller.signal).then(data => {
      if (!controller.signal.aborted) setItems(data);
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar a lista.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [incluirInativos, revision]);

  async function edit(item: Caminhao) {
    setBusy(true); setError(''); setFeedback('');
    try { setSelected(await caminhoesApi.obter(item.id)); setPanel('edit'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível abrir o cadastro.'); }
    finally { setBusy(false); }
  }
  async function save(body: CriarCaminhao) {
    if (saving.current) return;
    saving.current = true; setBusy(true);
    try {
      if (panel === 'edit' && selected) await caminhoesApi.atualizar(selected.id, { ...body, ativo: selected.ativo });
      else await caminhoesApi.cadastrar(body);
      setFeedback(panel === 'edit' ? 'Alterações salvas.' : 'Caminhão cadastrado como ativo.');
      setPanel(null); setRevision(value => value + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  async function deactivate() {
    if (!selected || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      await caminhoesApi.desativar(selected.id);
      setPanel(null); setFeedback('Caminhão desativado.'); setRevision(value => value + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível desativar.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const filtered = filtrarCaminhoes(items, busca, situacao);
  return <>
    <PageHeader title="Caminhões" description="Os veículos que acompanham sua operação." action={<button className={styles.primary} disabled={busy} onClick={() => { setSelected(undefined); setFeedback(''); setPanel('create'); }}>Cadastrar caminhão</button>} />
    <p role="status" aria-live="polite" className={feedback ? styles.feedback : undefined}>{feedback}</p>
    <section aria-label="Cadastro de caminhões" className={styles.workspace}>
      <div className={styles.toolbar}>
        <div className={styles.field}><label htmlFor="busca">Buscar por placa ou modelo</label><input id="busca" type="search" value={busca} onChange={event => setBusca(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="situacao">Situação</label><select id="situacao" value={situacao} onChange={event => setSituacao(event.target.value as FiltroSituacao)}><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option></select></div>
      </div>
      {error && panel !== 'deactivate' && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <button onClick={() => setRevision(value => value + 1)}>Atualizar lista</button></div>}
      {loading ? <p className={styles.message} role="status">Carregando caminhões…</p> : !error && (filtered.length ? <CaminhoesTable items={filtered} busy={busy} onEdit={edit} onDeactivate={item => { setSelected(item); setError(''); setFeedback(''); setPanel('deactivate'); }} /> : <p className={styles.message}>{busca ? 'Nenhum resultado para esta busca.' : 'Nenhum caminhão encontrado neste filtro.'}</p>)}
    </section>
    {(panel === 'create' || panel === 'edit') && <SidePanel title={panel === 'create' ? 'Cadastrar caminhão' : 'Editar caminhão'} busy={busy} onClose={() => setPanel(null)}><CaminhaoForm caminhao={selected} busy={busy} onSave={save} /></SidePanel>}
    {panel === 'deactivate' && selected && <SidePanel title="Desativar caminhão" busy={busy} onClose={() => { setPanel(null); setError(''); }}><p>Desativar o caminhão {selected.placa}? O cadastro será mantido e poderá ser consultado no filtro de inativos.</p>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><button disabled={busy} onClick={() => setPanel(null)}>Cancelar</button><button disabled={busy} onClick={deactivate}>{busy ? 'Desativando…' : 'Desativar caminhão'}</button></div></SidePanel>}
  </>;
}
