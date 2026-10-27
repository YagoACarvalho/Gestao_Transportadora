import { Button, Card, CollectionSummary, CollectionHeader, EmptyState } from '../ui';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { caminhoesApi } from '../features/caminhoes/caminhoesApi';
import { filtrarCaminhoes } from '../features/caminhoes/types';
import type { CriarCaminhao, FiltroSituacao, Caminhao } from '../features/caminhoes/types';
import { CaminhoesTable } from '../features/caminhoes/CaminhoesTable';
import { CaminhaoForm } from '../features/caminhoes/CaminhaoForm';
import { SidePanel } from '../components/SidePanel';
import { HttpError } from '../api/http';
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
  const [panel, setPanel] = useState<'create' | 'edit' | 'deactivate' | 'reactivate' | null>(null);
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

  async function edit(item: Caminhao, acao: 'edit' | 'deactivate' | 'reactivate' = 'edit') {
    setBusy(true); setError(''); setFeedback('');
    try { setSelected(await caminhoesApi.obter(item.id)); setPanel(acao); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível abrir o cadastro.'); }
    finally { setBusy(false); }
  }
  async function save(body: CriarCaminhao & { ativo?: boolean }) {
    if (saving.current) return;
    saving.current = true; setBusy(true);
    try {
      if (panel === 'edit' && selected) await caminhoesApi.atualizar(selected.id, { ...body, ativo: body.ativo ?? selected.ativo });
      else await caminhoesApi.cadastrar(body);
      setFeedback(panel === 'edit' ? 'Alterações salvas.' : 'Caminhão cadastrado como ativo.');
      setPanel(null); setRevision(value => value + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  async function changeActive() {
    if (!selected || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      if (panel === 'reactivate') await caminhoesApi.atualizar(selected.id, { placa: selected.placa, modelo: selected.modelo, ativo: true });
      else await caminhoesApi.desativar(selected.id);
      setPanel(null); setFeedback(panel === 'reactivate' ? 'Caminhão reativado.' : 'Caminhão desativado.'); setRevision(value => value + 1);
    } catch (failure) { setError(failure instanceof HttpError ? Object.values(failure.fields).flat().join(' ') || failure.message : failure instanceof Error ? failure.message : 'Não foi possível alterar a situação.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const filtered = filtrarCaminhoes(items, busca, situacao);
  return <>
    <PageHeader title="Caminhões" description="Os veículos que acompanham sua operação." action={<Button disabled={busy} onClick={() => { setSelected(undefined); setFeedback(''); setPanel('create'); }}>Cadastrar caminhão</Button>} />
    <p role="status" aria-live="polite" className={feedback ? styles.feedback : undefined}>{feedback}</p>
    <CollectionSummary loading={loading} error={error} items={[{ title: 'Cadastros carregados', value: items.length, description: 'Conforme a situação consultada' },{ title: 'Ativos nesta consulta', value: items.filter(item => item.ativo).length, description: 'Disponíveis para novos vínculos' },{ title: 'Resultados do filtro', value: filtered.length, description: 'Cadastros que correspondem à busca' }]} />
    <Card span={12} aria-label="Cadastro de caminhões" className={styles.workspace}>
      <CollectionHeader title="Frota cadastrada" count={loading || error ? undefined : filtered.length} description="Veículos da transportadora e sua situação cadastral." />
      <div className={styles.toolbar}>
        <div className={styles.field}><label htmlFor="busca">Buscar por placa ou modelo</label><input id="busca" type="search" value={busca} onChange={event => setBusca(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="situacao">Situação</label><select id="situacao" value={situacao} onChange={event => setSituacao(event.target.value as FiltroSituacao)}><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option></select></div>
      </div>
      {error && panel !== 'deactivate' && panel !== 'reactivate' && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <Button variant="secondary" onClick={() => setRevision(value => value + 1)}>Atualizar lista</Button></div>}
      {loading ? <p className={styles.message} role="status">Carregando caminhões…</p> : !error && (filtered.length ? <CaminhoesTable items={filtered} busy={busy} onEdit={edit} onDeactivate={item => edit(item, 'deactivate')} onReactivate={item => edit(item, 'reactivate')} /> : <EmptyState title={busca ? 'Nenhum resultado para esta busca.' : 'Nenhum caminhão encontrado neste filtro.'} description="Ajuste os filtros ou cadastre o primeiro veículo da frota." />)}
    </Card>
    {(panel === 'create' || panel === 'edit') && <SidePanel title={panel === 'create' ? 'Cadastrar caminhão' : 'Editar caminhão'} busy={busy} onClose={() => setPanel(null)}><CaminhaoForm caminhao={selected} busy={busy} onSave={save} /></SidePanel>}
    {panel === 'deactivate' && selected && <SidePanel title="Desativar caminhão" busy={busy} onClose={() => { setPanel(null); setError(''); }}><p>Desativar o caminhão {selected.placa}? O cadastro será mantido e poderá ser consultado no filtro de inativos.</p>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => setPanel(null)}>Cancelar</Button><Button variant="secondary" disabled={busy} onClick={changeActive}>{busy ? 'Desativando…' : 'Desativar caminhão'}</Button></div></SidePanel>}
    {panel === 'reactivate' && selected && <SidePanel title="Reativar caminhão" busy={busy} onClose={() => { setPanel(null); setError(''); }}><p>Reativar o caminhão {selected.placa}? O veículo ficará disponível para novos vínculos em viagens.</p>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => { setPanel(null); setError(''); }}>Voltar</Button><Button disabled={busy} onClick={changeActive}>{busy ? 'Reativando…' : 'Reativar caminhão'}</Button></div></SidePanel>}
  </>;
}
