import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Card, EmptyState, PageHeader, Tabs } from '../ui';
import { HttpError } from '../api/http';
import { motoristasApi } from '../features/motoristas/motoristasApi';
import { caminhoesApi } from '../features/caminhoes/caminhoesApi';
import type { Motorista } from '../features/motoristas/types';
import type { Caminhao } from '../features/caminhoes/types';
import { periodoDoMes } from '../features/financeiro/indicadores';
import { formatarData } from '../features/viagens/types';
import { moeda } from '../features/despesas/types';
import { fechamentosApi } from '../features/fechamentos/fechamentosApi';
import type { AcertoFechamento, FiltrosFechamento, PaginaFechamentos, PreviaFechamento, SalvarAcerto } from '../features/fechamentos/fechamentosApi';
import { ConteudoFechamento } from '../features/fechamentos/ConteudoFechamento';
import styles from '../features/fechamentos/Fechamentos.module.css';

const situacoes = ['Planejada', 'Em andamento', 'Pausada', 'Concluída', 'Cancelada'];
const erroMensagem = (e: unknown) => e instanceof HttpError && Object.keys(e.fields).length ? Object.values(e.fields).flat().join(' ') : e instanceof Error ? e.message : 'Não foi possível concluir a operação.';
export function FechamentosPage() {
  const [aba, setAba] = useState<'consulta' | 'historico'>('consulta');
  const [filtros, setFiltros] = useState<FiltrosFechamento>(() => { const p = periodoDoMes(0); return { dataInicial: p.inicio, dataFinal: p.fim, motoristaId: null, caminhaoId: null, situacoes: [], categoria: null, incluirDespesasGerais: true }; });
  const [previa, setPrevia] = useState<PreviaFechamento | null>(null);
  const [titulo, setTitulo] = useState('');
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupErro, setLookupErro] = useState('');
  const [lookupRevisao, setLookupRevisao] = useState(0);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [pagina, setPagina] = useState(1);
  const [historico, setHistorico] = useState<PaginaFechamentos | null>(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histErro, setHistErro] = useState('');
  const [histRevisao, setHistRevisao] = useState(0);
  const [acerto, setAcerto] = useState<AcertoFechamento | null>(null);
  const request = useRef<AbortController | null>(null);
  const envio = useRef<SalvarAcerto | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const invalido = !!(filtros.dataInicial && filtros.dataFinal && filtros.dataInicial > filtros.dataFinal);
  useEffect(() => {
    const controller = new AbortController(); setLookupLoading(true); setLookupErro('');
    Promise.all([motoristasApi.listar(true, controller.signal), caminhoesApi.listar(true, controller.signal)]).then(([m, c]) => {
      if (!controller.signal.aborted) { setMotoristas(m); setCaminhoes(c); }
    }).catch(e => { if (!controller.signal.aborted) setLookupErro(erroMensagem(e)); }).finally(() => { if (!controller.signal.aborted) setLookupLoading(false); });
    return () => controller.abort();
  }, [lookupRevisao]);
  useEffect(() => {
    if (aba !== 'historico') return;
    const controller = new AbortController(); setHistLoading(true); setHistErro(''); setHistorico(null);
    fechamentosApi.listar(pagina, controller.signal).then(h => { if (!controller.signal.aborted) setHistorico(h); })
      .catch(e => { if (!controller.signal.aborted) setHistErro(erroMensagem(e)); }).finally(() => { if (!controller.signal.aborted) setHistLoading(false); });
    return () => controller.abort();
  }, [aba, pagina, histRevisao]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { if (acerto) window.setTimeout(() => heading.current?.focus(), 0); }, [acerto]);
  function mudar(patch: Partial<FiltrosFechamento>) { setFiltros(f => ({ ...f, ...patch })); setPrevia(null); envio.current = null; setErro(''); setMensagem(''); }
  async function consultar(event: FormEvent) {
    event.preventDefault(); if (invalido || busy) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setBusy(true); setErro(''); setMensagem(''); setPrevia(null); envio.current = null;
    try { const p = await fechamentosApi.previa(filtros, controller.signal); if (!controller.signal.aborted) { setPrevia(p); window.setTimeout(() => heading.current?.focus(), 0); } }
    catch (e) { if (!controller.signal.aborted) setErro(erroMensagem(e)); }
    finally { if (request.current === controller) setBusy(false); }
  }
  async function salvar(event: FormEvent) {
    event.preventDefault(); if (!previa || busy || !titulo.trim()) return;
    // Mantém a mesma chave em nova tentativa após falha de rede ou resposta perdida.
    envio.current ??= { titulo: titulo.trim(), filtros: previa.filtros, versaoPrevia: previa.versaoPrevia, chaveRequisicao: crypto.randomUUID() };
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setBusy(true); setErro(''); setMensagem('');
    try {
      const salvo = await fechamentosApi.salvar(envio.current, controller.signal);
      if (!controller.signal.aborted) { setAcerto(salvo); setPrevia(null); envio.current = null; setTitulo(''); setAba('historico'); setPagina(1); setHistRevisao(r => r + 1); setMensagem('Acerto salvo. Os valores e lançamentos foram preservados no histórico.'); }
    } catch (e) {
      if (!controller.signal.aborted) {
        if (e instanceof HttpError && e.status === 409) { setPrevia(null); envio.current = null; setErro('A prévia mudou ou esta requisição já foi usada. Consulte o histórico e atualize a prévia antes de confirmar outro acerto.'); }
        else setErro(`${erroMensagem(e)} Se o resultado do salvamento ficou incerto, tente novamente sem alterar o título ou confira o histórico.`);
      }
    } finally { if (request.current === controller) setBusy(false); }
  }
  async function abrir(id: string) {
    request.current?.abort(); const controller = new AbortController(); request.current = controller; setBusy(true); setErro(''); setAcerto(null);
    try { const a = await fechamentosApi.detalhes(id, controller.signal); if (!controller.signal.aborted) setAcerto(a); }
    catch (e) { if (!controller.signal.aborted) setErro(erroMensagem(e)); }
    finally { if (request.current === controller) setBusy(false); }
  }
  function atalho(deslocamento?: number) { const p = deslocamento === undefined ? { inicio: null, fim: null } : periodoDoMes(deslocamento); mudar({ dataInicial: p.inicio, dataFinal: p.fim }); }
  return <>
    <PageHeader title="Fechamentos" subtitle="Confira a operação e preserve os acertos com seus valores e lançamentos." />
    <div className={styles.surface}>
      <fieldset disabled={busy} className={styles.fieldset}><legend>Visualização</legend><Tabs label="Consulta e histórico" value={aba} onChange={a => { setAba(a); setErro(''); setMensagem(''); }} options={[{ value: 'consulta', label: 'Consultar fechamento' }, { value: 'historico', label: 'Acertos salvos' }]} /></fieldset>
      {erro && <p role="alert" className={styles.error}>{erro}</p>}{mensagem && <p role="status" className={styles.notice}>{mensagem}</p>}
      {aba === 'consulta' ? <>
        <Card title="Filtros do fechamento" span={12}>
          <form onSubmit={consultar} className={styles.stack}><fieldset disabled={busy} className={`${styles.fieldset} ${styles.stack}`}><legend>Período e operação</legend>
            <div className={styles.actions}><Button variant="secondary" onClick={() => atalho(0)}>Mês atual</Button><Button variant="secondary" onClick={() => atalho(-1)}>Mês anterior</Button><Button variant="secondary" onClick={() => atalho()}>Todo o histórico</Button></div>
            <div className={styles.fields}>
              <div className={styles.field}><label htmlFor="fechamento-inicio">Data inicial</label><input id="fechamento-inicio" type="date" value={filtros.dataInicial ?? ''} onChange={e => mudar({ dataInicial: e.target.value || null })} /></div>
              <div className={styles.field}><label htmlFor="fechamento-fim">Data final</label><input id="fechamento-fim" type="date" value={filtros.dataFinal ?? ''} onChange={e => mudar({ dataFinal: e.target.value || null })} /></div>
              <div className={styles.field}><label htmlFor="fechamento-motorista">Motorista</label><select id="fechamento-motorista" value={filtros.motoristaId ?? ''} disabled={lookupLoading || !!lookupErro} onChange={e => mudar({ motoristaId: e.target.value || null })}><option value="">Todos</option>{motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}{!m.ativo && ' (inativo)'}</option>)}</select></div>
              <div className={styles.field}><label htmlFor="fechamento-caminhao">Caminhão</label><select id="fechamento-caminhao" value={filtros.caminhaoId ?? ''} disabled={lookupLoading || !!lookupErro} onChange={e => mudar({ caminhaoId: e.target.value || null })}><option value="">Todos</option>{caminhoes.map(c => <option key={c.id} value={c.id}>{c.placa}{!c.ativo && ' (inativo)'}</option>)}</select></div>
              <div className={styles.field}><label htmlFor="fechamento-categoria">Categoria da despesa</label><input id="fechamento-categoria" maxLength={50} value={filtros.categoria ?? ''} onChange={e => mudar({ categoria: e.target.value || null })} /><span className={styles.caption}>Nome exato da categoria. Vazio inclui todas; este filtro limita somente custos.</span></div>
            </div>
            <fieldset className={styles.fieldset}><legend>Situações das viagens (nenhuma marcada inclui todas)</legend><div className={styles.checks}>{situacoes.map(s => <label key={s}><input type="checkbox" checked={filtros.situacoes.includes(s)} onChange={e => mudar({ situacoes: e.target.checked ? [...filtros.situacoes, s] : filtros.situacoes.filter(v => v !== s) })} />{s}</label>)}</div></fieldset>
            <label><input type="checkbox" checked={filtros.incluirDespesasGerais} onChange={e => mudar({ incluirDespesasGerais: e.target.checked })} />Incluir despesas gerais compatíveis com os filtros</label>
            <p className={styles.caption}>Gerais não são rateadas para motoristas. Com filtro de caminhão, entram somente as gerais desse caminhão. Somente despesas marcadas para inclusão financeira compõem o resultado.</p>
            {invalido && <p role="alert" className={styles.error}>A data final deve ser igual ou posterior à inicial.</p>}
            {lookupLoading && <p role="status">Carregando motoristas e caminhões…</p>}
            {lookupErro && <div role="alert">{lookupErro} <Button variant="secondary" onClick={() => setLookupRevisao(r => r + 1)}>Recarregar cadastros</Button></div>}
            <Button type="submit" disabled={invalido || lookupLoading || !!lookupErro}>Consultar prévia</Button>
          </fieldset></form>
        </Card>
        {busy && <p role="status">Processando fechamento…</p>}
        {previa ? <><h2 ref={heading} tabIndex={-1}>Prévia para conferência</h2><ConteudoFechamento conteudo={previa} />
          <Card title="Salvar acerto" span={12}><form onSubmit={salvar} className={styles.stack}><div className={styles.field}><label htmlFor="fechamento-titulo">Título do acerto</label><input id="fechamento-titulo" required maxLength={150} value={titulo} disabled={busy} onChange={e => { setTitulo(e.target.value); envio.current = null; }} /></div>
            <p>O acerto preserva estes valores. Edições futuras nas viagens ou despesas aparecerão em novas consultas, mantendo este histórico.</p>
            {(!previa.filtros.dataInicial || !previa.filtros.dataFinal) && <p className={styles.notice}>Para salvar, defina as duas datas e consulte a prévia novamente.</p>}
            <Button type="submit" disabled={busy || !titulo.trim() || !previa.filtros.dataInicial || !previa.filtros.dataFinal}>Salvar acerto conferido</Button></form></Card>
        </> : !busy && <EmptyState title="Confira antes de salvar" description="Escolha os filtros e consulte os fretes e custos que compõem o resultado." />}
      </> : <>
        <p className={styles.notice}>Acertos podem ter períodos sobrepostos. São registros de conferência independentes; seus resultados não devem ser somados.</p>
        {histLoading && <p role="status">Carregando histórico…</p>}
        {histErro && <div role="alert">{histErro} <Button variant="secondary" onClick={() => setHistRevisao(r => r + 1)}>Recarregar histórico</Button></div>}
        {historico && <Card title="Acertos salvos" span={12}><div className={styles.scroll} role="region" aria-label="Histórico de acertos" tabIndex={0}><table className={styles.table}><caption>{historico.quantidadeTotal} acertos no histórico</caption><thead><tr><th>Título</th><th>Período</th><th>Salvo em</th><th>Resultado</th><th>Ação</th></tr></thead><tbody>{historico.itens.map(a => <tr key={a.id}><th scope="row">{a.titulo}</th><td>{formatarData(a.dataInicial)} a {formatarData(a.dataFinal)}</td><td>{new Date(a.dataCriacao).toLocaleString('pt-BR')}</td><td>{moeda(a.totais.resultado)}</td><td><Button variant="secondary" disabled={busy} onClick={() => abrir(a.id)} aria-label={`Ver acerto ${a.titulo}`}>Ver acerto</Button></td></tr>)}</tbody></table></div>
          {!historico.itens.length && <EmptyState title="Nenhum acerto nesta página" description="Consulte e confira uma prévia para salvar seu primeiro acerto." />}
          <div className={styles.actions}><Button variant="secondary" disabled={busy || pagina <= 1} onClick={() => setPagina(p => p - 1)}>Página anterior</Button><span>Página {historico.pagina}</span><Button variant="secondary" disabled={busy || pagina * historico.tamanhoPagina >= historico.quantidadeTotal} onClick={() => setPagina(p => p + 1)}>Próxima página</Button></div>
        </Card>}
        {busy && <p role="status">Carregando acerto…</p>}
        {acerto && <section className={styles.stack} aria-label="Acerto preservado"><div className={styles.actions}><h2 ref={heading} tabIndex={-1}>{acerto.titulo}</h2><Button variant="secondary" onClick={() => setAcerto(null)}>Fechar detalhes</Button></div><p>Salvo em {new Date(acerto.dataCriacao).toLocaleString('pt-BR')}. Identificador do responsável: {acerto.usuarioId}.</p><p className={styles.notice}>Valores preservados no salvamento. Este acerto não é recalculado a partir dos cadastros atuais.</p><ConteudoFechamento conteudo={acerto.conteudo} /></section>}
      </>}
    </div>
  </>;
}
