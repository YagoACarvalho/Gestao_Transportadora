import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SidePanel } from '../components/SidePanel';
import { ViagemForm } from '../features/viagens/ViagemForm';
import { ViagensTable } from '../features/viagens/ViagensTable';
import { ViagemDetails } from '../features/viagens/ViagemDetails';
import { viagensApi } from '../features/viagens/viagensApi';
import type { ResumoCancelamento } from '../features/viagens/viagensApi';
import { moeda } from '../features/despesas/types';
import { dadosCompletos, dadosDaViagem, filtrarViagens, proximasSituacoes, situacoes, semSituacao } from '../features/viagens/types';
import type { DadosViagem, SituacaoViagem, Viagem } from '../features/viagens/types';
import { HttpError } from '../api/http';
import { Button, Card, CollectionSummary, CollectionHeader, EmptyState, Tabs } from '../ui';
import styles from '../components/Cadastro.module.css';

export function ViagensPage() {
  const [items, setItems] = useState<Viagem[]>([]);
  const [busca, setBusca] = useState(''); const [status, setStatus] = useState('');
  const [inicio, setInicio] = useState(''); const [fim, setFim] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [feedback, setFeedback] = useState('');
  const [revision, setRevision] = useState(0); const saving = useRef(false);
  const [panel, setPanel] = useState<'create' | 'edit' | 'regularize' | 'status' | 'details' | null>(null);
  const [selected, setSelected] = useState<Viagem>(); const [target, setTarget] = useState<SituacaoViagem>('Planejada');
  const [cancelamento, setCancelamento] = useState<ResumoCancelamento>();
  const [manterDespesas, setManterDespesas] = useState('');
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
      if (next ? !proximasSituacoes(current.status).includes(next) : current.status !== 'Planejada' && !semSituacao(current.status))
        throw new Error('A situação desta viagem mudou. Atualize a lista antes de continuar.');
      setCancelamento(undefined); setManterDespesas('');
      if (next === 'Cancelada') setCancelamento(await viagensApi.prepararCancelamento(item.id));
      setSelected(current); if (next) setTarget(next); setPanel(next ? 'status' : semSituacao(current.status) ? 'regularize' : 'edit');
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível consultar a viagem.'); }
    finally { setBusy(false); }
  }
  async function save(body: DadosViagem) {
    if (saving.current) return; saving.current = true; setBusy(true);
    try {
      if ((panel === 'edit' || panel === 'regularize') && selected) await viagensApi.atualizar(selected.id, { ...body, status: 'Planejada' });
      else await viagensApi.cadastrar(body);
      setFeedback(panel === 'regularize' ? 'Viagem regularizada como planejada.' : panel === 'edit' ? 'Alterações salvas.' : 'Viagem cadastrada como planejada.'); setPanel(null); setRevision(v => v + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  async function viewDetails(item: Viagem) {
    setBusy(true); setError(''); setFeedback('');
    try { setSelected(await viagensApi.obter(item.id)); setPanel('details'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível consultar os detalhes.'); }
    finally { setBusy(false); }
  }
  const launchExpense = (item: Viagem) => { window.location.hash = `#/despesas?viagemId=${encodeURIComponent(item.id)}`; };
  async function changeStatus() {
    if (!selected || target !== 'Cancelada' && !dadosCompletos(selected) || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      if (target === 'Cancelada') {
        if (!cancelamento || cancelamento.quantidadeDespesas > 0 && !manterDespesas) return;
        await viagensApi.confirmarCancelamento(selected.id, cancelamento.versaoDespesas, manterDespesas ? manterDespesas === 'sim' : null);
      }
      else if (dadosCompletos(selected)) await viagensApi.atualizar(selected.id, { ...dadosDaViagem(selected), status: target });
      setPanel(null); setFeedback(`Situação da viagem alterada para ${target.toLocaleLowerCase('pt-BR')}.`); setRevision(v => v + 1);
    }
    catch (failure) { setError(failure instanceof HttpError ? Object.values(failure.fields).flat().join(' ') || failure.message : failure instanceof Error ? failure.message : 'Não foi possível alterar a situação.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const filtered = filtrarViagens(items, busca, status, inicio, fim);
  return <>
    <PageHeader title="Viagens" description="Percursos, equipe e andamento da operação." action={<Button icon={<span aria-hidden="true">＋</span>} disabled={busy} onClick={() => { setSelected(undefined); setFeedback(''); setPanel('create'); }}>Cadastrar viagem</Button>} />
    <p role="status" className={feedback ? styles.feedback : undefined}>{feedback}</p>
    {busy && !panel && <p role="status" className={styles.message}>Carregando viagem…</p>}
    <CollectionSummary loading={loading} error={error} items={[
      { title: 'Viagens planejadas', value: items.filter(item => item.status === 'Planejada').length, description: 'Prontas para organizar a saída' },
      { title: 'Em andamento', value: items.filter(item => item.status === 'Em andamento').length, description: 'Percursos em execução' },
      { title: 'Pausadas', value: items.filter(item => item.status === 'Pausada').length, description: 'Aguardando retomada da operação' },
      { title: 'Concluídas', value: items.filter(item => item.status === 'Concluída').length, description: 'Percursos finalizados no histórico' },
    ]} />
    <Card span={12} className={styles.workspace} aria-label="Viagens">
      <CollectionHeader title="Acompanhamento de viagens" count={loading || error ? undefined : filtered.length} description="Organize o percurso e acompanhe cada etapa da operação." />
      <div className={styles.statusFilters}><Tabs label="Filtrar andamento" value={status} onChange={setStatus} options={[{ value: '', label: 'Todas' }, ...situacoes.map(s => ({ value: s, label: s }))]} /></div>
      <div className={styles.toolbar}>
        <div className={styles.field}><label htmlFor="busca">Buscar percurso, motorista ou placa</label><input id="busca" type="search" value={busca} onChange={e => setBusca(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor="situacao">Situação</label><select id="situacao" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todas</option>{situacoes.map(s => <option key={s}>{s}</option>)}</select></div>
        <div className={styles.field}><label htmlFor="inicio">Data inicial</label><input id="inicio" type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor="fim">Data final</label><input id="fim" type="date" value={fim} onChange={e => setFim(e.target.value)} /></div>
      </div>
      {inicio && fim && inicio > fim && <p role="alert" className={styles.message}>A data inicial está depois da data final. Ajuste o período.</p>}
      {error && panel !== 'status' && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <Button variant="secondary" onClick={() => setRevision(v => v + 1)}>Atualizar lista</Button></div>}
      {loading ? <p role="status" className={styles.message}>Carregando viagens…</p> : !error && (filtered.length ? <ViagensTable items={filtered} busy={busy} onEdit={item => open(item)} onStatus={open} onDetails={viewDetails} onExpense={launchExpense} /> : <EmptyState title="Nenhuma viagem encontrada neste filtro." description="Ajuste os filtros ou cadastre uma viagem para organizar o próximo percurso." />)}
    </Card>
    {(panel === 'create' || panel === 'edit' || panel === 'regularize') && <SidePanel title={panel === 'regularize' ? 'Regularizar viagem' : panel === 'create' ? 'Cadastrar viagem' : 'Editar viagem'} busy={busy} onClose={() => setPanel(null)}>{panel === 'regularize' && <p>Complete os dados para salvar esta viagem como Planejada. As despesas existentes e suas escolhas financeiras serão preservadas, sem remuneração retroativa.</p>}<ViagemForm viagem={selected} busy={busy} onSave={save} regularizando={panel === 'regularize'} /></SidePanel>}
    {panel === 'details' && selected && <SidePanel title="Detalhes da viagem" busy={busy} onClose={() => setPanel(null)}><ViagemDetails viagem={selected} onExpense={() => launchExpense(selected)} /></SidePanel>}
    {panel === 'status' && selected && <SidePanel title="Alterar situação da viagem" busy={busy} onClose={() => { setPanel(null); setError(''); }}>
      <p>{selected.origem || 'Origem não informada'} para {selected.destino || 'Destino não informado'}</p><p>Alterar de {selected.status || 'Não informada'} para {target}?</p>
      {target === 'Planejada' && <p>Reabrir preserva os dados, as despesas e suas escolhas de inclusão financeira. Não gera remuneração retroativa. {selected.status === 'Cancelada' && 'O frete voltará a compor o saldo previsto.'}</p>}
      {target !== 'Cancelada' && !dadosCompletos(selected) && <p role="alert">Os dados desta viagem estão incompletos. Revise o cadastro antes de alterar a situação.</p>}
      {target === 'Cancelada' && cancelamento && <>
        <p>Esta viagem possui {cancelamento.quantidadeDespesas} despesa(s), totalizando {moeda(cancelamento.totalDespesas)}.</p>
        {cancelamento.quantidadeDespesas > 0 && <fieldset disabled={busy}><legend>Como deseja tratar essas despesas?</legend>
          <p><label><input type="radio" name="manterDespesas" value="sim" checked={manterDespesas === 'sim'} onChange={e => setManterDespesas(e.target.value)} /> Manter no financeiro</label></p>
          <p><label><input type="radio" name="manterDespesas" value="nao" checked={manterDespesas === 'nao'} onChange={e => setManterDespesas(e.target.value)} /> Desconsiderar no financeiro e preservar no histórico</label></p>
        </fieldset>}
      </>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.actions}><Button variant="secondary" disabled={busy} onClick={() => setPanel(null)}>Voltar</Button><Button disabled={busy || (target === 'Cancelada' ? !cancelamento || cancelamento.quantidadeDespesas > 0 && !manterDespesas : !dadosCompletos(selected))} onClick={changeStatus}>{busy ? 'Salvando…' : 'Confirmar alteração'}</Button></div>
    </SidePanel>}
  </>;
}
