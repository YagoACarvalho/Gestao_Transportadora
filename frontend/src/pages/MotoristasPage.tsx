import { Button, Card, CollectionSummary, CollectionHeader, EmptyState } from '../ui';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { motoristasApi } from '../features/motoristas/motoristasApi';
import { filtrarMotoristas } from '../features/motoristas/types';
import type { CriarMotorista, FiltroSituacao, Motorista } from '../features/motoristas/types';
import { MotoristasCards } from '../features/motoristas/MotoristasCards';
import { MotoristaForm } from '../features/motoristas/MotoristaForm';
import { SidePanel } from '../components/SidePanel';
import { HttpError } from '../api/http';
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
  const [panel, setPanel] = useState<'create' | 'edit' | 'deactivate' | 'reactivate' | null>(null);
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

  async function edit(item: Motorista, acao: 'edit' | 'deactivate' | 'reactivate' = 'edit') {
    setBusy(true); setError(''); setFeedback('');
    try { setSelected(await motoristasApi.obter(item.id)); setPanel(acao); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível abrir o cadastro.'); }
    finally { setBusy(false); }
  }
  async function save(body: CriarMotorista & { ativo?: boolean }) {
    if (saving.current) return;
    saving.current = true; setBusy(true);
    try {
      if (panel === 'edit' && selected) await motoristasApi.atualizar(selected.id, { ...body, ativo: body.ativo ?? selected.ativo });
      else await motoristasApi.cadastrar(body);
      setFeedback(panel === 'edit' ? 'Alterações salvas.' : 'Motorista cadastrado como ativo.');
      setPanel(null); setRevision(value => value + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  async function changeActive() {
    if (!selected || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      if (panel === 'reactivate') await motoristasApi.atualizar(selected.id, { nome: selected.nome, cpf: selected.cpf,
        numeroCnh: selected.numeroCnh, categoriaCnh: selected.categoriaCnh, dataValidadeCnh: selected.dataValidadeCnh, telefone: selected.telefone, ativo: true });
      else await motoristasApi.desativar(selected.id);
      setPanel(null); setFeedback(panel === 'reactivate' ? 'Motorista reativado.' : 'Motorista desativado.'); setRevision(value => value + 1);
    } catch (failure) { setError(failure instanceof HttpError ? Object.values(failure.fields).flat().join(' ') || failure.message : failure instanceof Error ? failure.message : 'Não foi possível alterar a situação.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const filtered = filtrarMotoristas(items, busca, situacao);
  return <>
    <PageHeader action={<Button disabled={busy} onClick={() => { setSelected(undefined); setFeedback(''); setPanel('create'); }}>Cadastrar motorista</Button>} />
    <p role="status" aria-live="polite" className={feedback ? styles.feedback : undefined}>{feedback}</p>
    <CollectionSummary loading={loading} error={error} items={[{ title: 'Cadastros carregados', value: items.length, description: 'Conforme a situação consultada' },{ title: 'Ativos nesta consulta', value: items.filter(item => item.ativo).length, description: 'Disponíveis para novos vínculos' },{ title: 'Resultados do filtro', value: filtered.length, description: 'Cadastros que correspondem à busca' }]} />
    <Card span={12} aria-label="Cadastro de motoristas" className={styles.workspace}>
      <CollectionHeader title="Equipe de motoristas" count={loading || error ? undefined : filtered.length} description="Consulte a equipe e mantenha os cadastros atualizados." />
      <div className={styles.toolbar}>
        <div className={styles.field}><label htmlFor="busca">Buscar por nome, CPF ou CNH</label><input id="busca" type="search" value={busca} onChange={event => setBusca(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="situacao">Situação</label><select id="situacao" value={situacao} onChange={event => setSituacao(event.target.value as FiltroSituacao)}><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option></select></div>
      </div>
      {error && panel !== 'deactivate' && panel !== 'reactivate' && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <Button variant="secondary" onClick={() => setRevision(value => value + 1)}>Atualizar lista</Button></div>}
      {loading ? <p className={styles.message} role="status">Carregando motoristas…</p> : !error && (filtered.length ? <MotoristasCards items={filtered} busy={busy} onEdit={edit} onDeactivate={item => edit(item, 'deactivate')} onReactivate={item => edit(item, 'reactivate')} /> : <EmptyState title={busca ? 'Nenhum resultado para esta busca.' : 'Nenhum motorista encontrado neste filtro.'} description="Ajuste a busca e a situação ou cadastre um motorista para começar." />)}
    </Card>
    {(panel === 'create' || panel === 'edit') && <SidePanel title={panel === 'create' ? 'Cadastrar motorista' : 'Editar motorista'} busy={busy} onClose={() => setPanel(null)}><MotoristaForm motorista={selected} busy={busy} onSave={save} /></SidePanel>}
    {panel === 'deactivate' && selected && <SidePanel title="Desativar motorista" busy={busy} onClose={() => { setPanel(null); setError(''); }}><p>Desativar {selected.nome}? O cadastro será mantido e poderá ser consultado no filtro de inativos.</p>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => setPanel(null)}>Cancelar</Button><Button variant="secondary" disabled={busy} onClick={changeActive}>{busy ? 'Desativando…' : 'Desativar motorista'}</Button></div></SidePanel>}
    {panel === 'reactivate' && selected && <SidePanel title="Reativar motorista" busy={busy} onClose={() => { setPanel(null); setError(''); }}><p>Reativar {selected.nome}? O motorista ficará disponível para novos vínculos em viagens.</p>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => { setPanel(null); setError(''); }}>Voltar</Button><Button disabled={busy} onClick={changeActive}>{busy ? 'Reativando…' : 'Reativar motorista'}</Button></div></SidePanel>}
  </>;
}
