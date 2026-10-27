import { lazy, Suspense, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { financeiroApi } from '../features/financeiro/financeiroApi';
import type { ResumoFinanceiro } from '../features/financeiro/financeiroApi';
import { moeda } from '../features/despesas/types';
import { formatarData } from '../features/viagens/types';
import { despesasApi } from '../features/despesas/despesasApi';
import { viagensApi } from '../features/viagens/viagensApi';
import { montarIndicadores, periodoDoMes } from '../features/financeiro/indicadores';
import page from './FinanceiroPage.module.css';
import styles from '../components/Cadastro.module.css';

const GraficosFinanceiros = lazy(() => import('../features/financeiro/GraficosFinanceiros'));

export function FinanceiroPage() {
  const [inicio, setInicio] = useState(''); const [fim, setFim] = useState('');
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' }); const [revision, setRevision] = useState(0);
  const [resumo, setResumo] = useState<ResumoFinanceiro>(); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [detalhes, setDetalhes] = useState<ReturnType<typeof montarIndicadores>>();
  const [detalhesError, setDetalhesError] = useState('');
  const invalido = !!(inicio && fim && inicio > fim);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setResumo(undefined);
    setDetalhes(undefined); setDetalhesError('');
    financeiroApi.resumo(periodo.inicio, periodo.fim, controller.signal).then(data => { if (!controller.signal.aborted) setResumo(data); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar o resumo.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    Promise.all([despesasApi.listar(controller.signal), viagensApi.listar(controller.signal)])
      .then(([despesas, viagens]) => { if (!controller.signal.aborted) setDetalhes(montarIndicadores(despesas, viagens, periodo.inicio, periodo.fim)); })
      .catch(() => { if (!controller.signal.aborted) setDetalhesError('Não foi possível carregar os gráficos e lançamentos.'); });
    return () => controller.abort();
  }, [periodo, revision]);
  const aplicar = (novo: { inicio: string; fim: string }) => { setInicio(novo.inicio); setFim(novo.fim); setPeriodo(novo); };
  return <>
    <PageHeader title="Resumo financeiro" description="Acompanhe os custos das viagens e da transportadora." action={<a className={page.action} href="#/despesas">Gerenciar despesas</a>} />
    <section aria-label="Período financeiro" className={page.periodo}>
      <div role="group" aria-label="Atalhos de período" className={page.presets}>
        <button onClick={() => aplicar(periodoDoMes(0))}>Mês atual</button><button onClick={() => aplicar(periodoDoMes(-1))}>Mês anterior</button><button onClick={() => aplicar({ inicio: '', fim: '' })}>Todo o histórico</button>
      </div>
      <form className={page.dates} onSubmit={event => { event.preventDefault(); if (!invalido) setPeriodo({ inicio, fim }); }}>
        <div className={styles.field}><label htmlFor="inicio">Data inicial</label><input id="inicio" type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor="fim">Data final</label><input id="fim" type="date" value={fim} onChange={e => setFim(e.target.value)} /></div>
        <button className={styles.primary} disabled={invalido || loading}>Aplicar período</button>
      </form>
      {invalido && <p role="alert" className={styles.message}>A data inicial está depois da data final. Ajuste o período.</p>}
    </section>
    <section aria-label="Resumo financeiro" aria-busy={loading}>
      {loading ? <p role="status" className={styles.message}>Carregando resumo financeiro…</p> : error ? <div role="alert" className={`${styles.message} ${styles.error}`}>{error} <button onClick={() => setRevision(v => v + 1)}>Tentar novamente</button></div> : resumo && <>
        <p className={page.periodLabel}>Período aplicado: {periodo.inicio ? formatarData(periodo.inicio) : 'sem data inicial'} a {periodo.fim ? formatarData(periodo.fim) : 'sem data final'}.</p>
        <dl className={page.summary}>
          <div className={page.balance}><dt>Saldo previsto</dt><dd>{moeda(resumo.lucro)}</dd><span>{!periodo.inicio && !periodo.fim ? 'Total acumulado de todo o histórico' : 'Total do período selecionado'}</span><small>Fretes menos todas as despesas</small></div>
          <div className={page.fretes}><dt>Fretes previstos</dt><dd>{moeda(resumo.totalFretes)}</dd><span>Viagens não canceladas</span></div>
          <div className={page.expenses}><dt>Total de despesas</dt><dd>{moeda(resumo.totalDespesas)}</dd><div className={page.expenseSplit}><span>Despesas de viagens<strong>{moeda(resumo.totalDespesasViagens)}</strong></span><span>Despesas gerais<strong>{moeda(resumo.totalDespesasGerais)}</strong></span></div></div>
        </dl>
        <section className={page.remuneracao} aria-label="Remuneração dos motoristas">
          <div><h2>Remuneração dos motoristas</h2><p>15% por viagem. Despesas automáticas já incluídas no total, conforme o período selecionado.</p></div>
          <strong>{moeda(resumo.totalRemuneracaoMotoristas)}</strong>
        </section>
        <p role="status" className={styles.srOnly}>Resumo carregado para o período aplicado.</p>
      </>}
    </section>
    {resumo && !loading && !error && <>
      {detalhesError ? <div role="alert" className={page.notice}>{detalhesError} <button onClick={() => setRevision(v => v + 1)}>Recarregar detalhes</button></div> : !detalhes ? <p role="status">Carregando detalhes financeiros…</p> : <>
        <Suspense fallback={<p role="status">Preparando gráficos…</p>}><GraficosFinanceiros detalhes={detalhes} resumo={resumo} /></Suspense>
        <section className={page.panel} aria-labelledby="recentes-titulo">
          <div className={page.sectionHeader}><h2 id="recentes-titulo">Últimos lançamentos</h2><a href="#/despesas">Ver e editar despesas</a></div>
          {detalhes.recentes.length ? <div className={styles.tableScroll} role="region" aria-label="Últimos lançamentos" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Lançamento</th><th scope="col">Tipo</th><th scope="col">Data</th><th scope="col" className={styles.numeric}>Valor</th></tr></thead><tbody>{detalhes.recentes.map(item => <tr key={item.id}><th scope="row">{item.descricao || 'Descrição não informada'}<span className={styles.secondary}>{item.categoria || 'Categoria não informada'}</span></th><td>{item.viagemId ? 'De viagem' : 'Geral'}</td><td>{formatarData(item.dataDespesa)}</td><td className={styles.numeric}>{item.valor === null ? 'Não informado' : moeda(item.valor)}</td></tr>)}</tbody></table></div> : <p>Nenhum lançamento neste período. <a href="#/despesas">Cadastrar despesa</a></p>}
        </section>
      </>}
    </>}
    <details className={page.explanation}><summary>Como os valores são calculados</summary>
      <p>Os fretes incluem viagens não canceladas, inclusive registros antigos sem situação definida. As despesas incluem todas as fases das viagens e os custos gerais.</p>
      <p>O período considera a data da viagem para fretes e a data da despesa para custos. Registros sem data entram apenas na consulta sem limites de período.</p>
      <p>Saldo previsto não representa recebimentos, pagamentos ou lucro realizado. Despesas gerais não são distribuídas entre viagens.</p>
      <p>Os detalhes usam as consultas atuais de viagens e despesas. Atualize o período para buscar novos lançamentos.</p>
    </details>
  </>;
}
