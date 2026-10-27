import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SidePanel } from '../components/SidePanel';
import { despesasApi } from '../features/despesas/despesasApi';
import { DespesaForm } from '../features/despesas/DespesaForm';
import { DespesaAutomaticaForm } from '../features/despesas/DespesaAutomaticaForm';
import { filtrarDespesas, moeda } from '../features/despesas/types';
import type { DadosDespesa, Despesa } from '../features/despesas/types';
import { formatarData } from '../features/viagens/types';
import styles from '../components/Cadastro.module.css';
import page from './DespesasPage.module.css';
import { viagensApi } from '../features/viagens/viagensApi';
import type { Viagem } from '../features/viagens/types';
import { ActionIcon } from '../components/ActionIcon';

export function DespesasPage() {
  const [items, setItems] = useState<Despesa[]>([]);
  const [viagemInicial, setViagemInicial] = useState<Viagem>();
  const [viagemInicialId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('viagemId'));
  const [tipo, setTipo] = useState<'todas' | 'viagem' | 'geral'>('todas');
  const [busca, setBusca] = useState(''); const [inicio, setInicio] = useState(''); const [fim, setFim] = useState(''); const [vinculo, setVinculo] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [feedback, setFeedback] = useState(''); const [revision, setRevision] = useState(0);
  const [panel, setPanel] = useState<'create' | 'edit' | 'delete' | null>(null); const [selected, setSelected] = useState<Despesa>();
  const saving = useRef(false);
  useEffect(() => {
    if (!viagemInicialId) return;
    let atual = true; setBusy(true);
    viagensApi.obter(viagemInicialId).then(viagem => { if (atual) { setViagemInicial(viagem); setSelected(undefined); setTipo('viagem'); setPanel('create'); } })
      .catch(failure => { if (atual) setError(failure instanceof Error ? failure.message : 'Não foi possível selecionar a viagem.'); })
      .finally(() => { if (atual) setBusy(false); });
    return () => { atual = false; };
  }, [viagemInicialId]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    despesasApi.listar(controller.signal).then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar despesas.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  async function open(item: Despesa, next: 'edit' | 'delete') {
    setBusy(true); setError(''); setFeedback('');
    try { setSelected(await despesasApi.obter(item.id)); setPanel(next); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível abrir o lançamento.'); }
    finally { setBusy(false); }
  }
  async function save(body: DadosDespesa) {
    if (saving.current) return; saving.current = true; setBusy(true);
    try {
      if (panel === 'edit' && selected) await despesasApi.atualizar(selected.id, body); else await despesasApi.cadastrar(body);
      setFeedback(panel === 'edit' ? 'Alterações salvas.' : 'Despesa cadastrada.'); setPanel(null); setRevision(v => v + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  async function remove() {
    if (!selected || saving.current) return; saving.current = true; setBusy(true); setError('');
    try { await despesasApi.excluir(selected.id); setPanel(null); setFeedback('Despesa excluída.'); setRevision(v => v + 1); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível excluir.'); }
    finally { saving.current = false; setBusy(false); }
  }
  async function saveFinancial(incluir: boolean) {
    if (!selected || saving.current) return;
    saving.current = true; setBusy(true);
    try { await despesasApi.alterarSituacaoFinanceira(selected.id, incluir); setPanel(null); setFeedback('Situação financeira salva.'); setRevision(v => v + 1); }
    finally { saving.current = false; setBusy(false); }
  }
  const periodoInvalido = !!(inicio && fim && inicio > fim);
  const filtered = filtrarDespesas(items, busca, inicio, fim, vinculo).filter(item => tipo === 'todas' || (tipo === 'viagem' ? !!item.viagemId : !item.viagemId));
  const viagens = Array.from(new Map(items.filter(i => i.viagemId).map(i => [i.viagemId!, i.viagem])).entries());
  return <>
    <PageHeader title="Despesas" description="Despesas das viagens e custos gerais da transportadora." action={<button className={styles.primary} disabled={busy} onClick={() => { setSelected(undefined); setViagemInicial(undefined); setFeedback(''); setPanel('create'); }}>Cadastrar despesa</button>} />
    <p role="status" className={feedback ? styles.feedback : undefined}>{feedback}</p>
    <section className={styles.workspace} aria-label="Despesas">
      <div className={page.filters} role="group" aria-label="Tipo de despesa">
        {([['todas', 'Todas'], ['viagem', 'De viagens'], ['geral', 'Gerais']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={tipo === value} className={tipo === value ? page.selected : undefined} onClick={() => { setTipo(value); setVinculo(''); }}>{label}</button>)}
        <a href="#/financeiro">Ver resumo financeiro</a>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.field}><label htmlFor="busca">Buscar descrição, categoria ou percurso</label><input id="busca" type="search" value={busca} onChange={e => setBusca(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor="vinculo">Viagem</label><select id="vinculo" value={vinculo} onChange={e => setVinculo(e.target.value)}><option value="">Todas</option><option value="sem-vinculo">Sem vínculo</option>{viagens.map(([id, viagem]) => <option key={id} value={id}>{viagem?.origem || 'Origem não informada'} → {viagem?.destino || 'Destino não informado'} · {id.slice(0, 8)}</option>)}</select></div>
        <div className={styles.field}><label htmlFor="inicio">Data inicial</label><input id="inicio" type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor="fim">Data final</label><input id="fim" type="date" value={fim} onChange={e => setFim(e.target.value)} /></div>
      </div>
      {periodoInvalido && <p role="alert" className={styles.message}>A data inicial está depois da data final. Ajuste o período.</p>}
      {!loading && !error && filtered.some(item => item.considerarNoFinanceiro === false) && <p className={styles.message}>Despesas desconsideradas permanecem na lista, mas não entram no total financeiro deste filtro.</p>}
      {error && panel !== 'delete' && <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <button onClick={() => setRevision(v => v + 1)}>Atualizar lista</button></div>}
      {loading ? <p role="status" className={styles.message}>Carregando despesas…</p> : !error && !periodoInvalido && (filtered.length ? <>
        <div className={styles.tableScroll} role="region" aria-label="Lista de despesas" tabIndex={0}><table className={styles.table}>
          <caption className={styles.srOnly}>Despesas encontradas</caption><thead><tr><th scope="col">Lançamento</th><th scope="col">Data</th><th scope="col">Viagem</th><th scope="col" className={styles.numeric}>Valor</th><th scope="col">Ações</th></tr></thead>
          <tbody>{filtered.map(item => <tr key={item.id}>
            <th scope="row">{item.descricao || 'Descrição não informada'}<span className={styles.secondary}>{item.categoria || 'Categoria não informada'}</span>{item.origem === 'RemuneracaoMotorista' && <span className={styles.secondary}>Automática: 15% do frete</span>}<span className={styles.secondary}>{item.considerarNoFinanceiro === false ? 'Desconsiderada no financeiro' : 'Incluída no financeiro'}</span></th><td>{formatarData(item.dataDespesa)}</td>
            <td>{item.viagemId ? <>{item.viagem?.origem || 'Origem não informada'} → {item.viagem?.destino || 'Destino não informado'}<span className={styles.secondary}>{item.viagem?.status || 'Situação não informada'}</span></> : 'Despesa geral'}</td>
            <td className={styles.numeric}>{item.valor === null ? 'Não informado' : moeda(item.valor)}</td>
            <td><div className={styles.actions}><button disabled={busy} onClick={() => open(item, 'edit')} aria-label={`${item.origem === 'RemuneracaoMotorista' ? 'Alterar situação financeira de' : 'Editar despesa'} ${item.descricao || 'sem descrição'}`}><ActionIcon acao={item.origem === 'RemuneracaoMotorista' ? 'financeiro' : 'editar'} />{item.origem === 'RemuneracaoMotorista' ? 'Situação financeira' : 'Editar'}</button>{item.origem !== 'RemuneracaoMotorista' && <button className={styles.danger} disabled={busy} onClick={() => open(item, 'delete')} aria-label={`Excluir despesa ${item.descricao || 'sem descrição'}`}><ActionIcon acao="excluir" />Excluir</button>}</div></td>
          </tr>)}</tbody>
        </table></div><p className={styles.message}>{filtered.length} lançamento(s) · Total deste filtro: <strong>{moeda(filtered.reduce((total, item) => total + (item.considerarNoFinanceiro === false ? 0 : item.valor ?? 0), 0))}</strong></p>
      </> : <p className={styles.message}>Nenhuma despesa encontrada. Cadastre um lançamento ou ajuste os filtros.</p>)}
    </section>
    {(panel === 'create' || panel === 'edit') && <SidePanel title={panel === 'create' ? 'Cadastrar despesa' : 'Editar despesa'} busy={busy} onClose={() => setPanel(null)}>{selected?.origem === 'RemuneracaoMotorista' ? <DespesaAutomaticaForm despesa={selected} busy={busy} onSave={saveFinancial} /> : <DespesaForm despesa={selected} viagemInicial={viagemInicial} tipoInicial={viagemInicial || tipo === 'viagem' ? 'viagem' : 'geral'} busy={busy} onSave={save} />}</SidePanel>}
    {panel === 'delete' && selected && <SidePanel title="Excluir despesa" busy={busy} onClose={() => { setPanel(null); setError(''); }}><p>Excluir permanentemente a despesa “{selected.descricao || 'Sem descrição'}”? Esta ação altera os totais financeiros e não pode ser desfeita.</p>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><button disabled={busy} onClick={() => { setPanel(null); setError(''); }}>Cancelar</button><button className={styles.danger} disabled={busy} onClick={remove}>{busy ? 'Excluindo…' : 'Excluir despesa'}</button></div></SidePanel>}
  </>;
}
