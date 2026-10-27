import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { moeda } from '../despesas/types';
import type { ResumoFinanceiro } from './financeiroApi';
import type { montarIndicadores } from './indicadores';
import styles from '../../pages/FinanceiroPage.module.css';

type Indicadores = ReturnType<typeof montarIndicadores>;
const mesLabel = (mes: string) => `${mes.slice(5)}/${mes.slice(0, 4)}`;
const eixoMonetario = (valor: number) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(valor);
const tooltipStyle = { borderRadius: 12, borderColor: 'var(--color-divider)', color: 'var(--color-deep)', background: 'var(--color-surface)' };

export default function GraficosFinanceiros({ detalhes, resumo }: { detalhes: Indicadores; resumo: ResumoFinanceiro }) {
  const tipos = [
    { nome: 'De viagens', valor: resumo.totalDespesasViagens, fill: 'var(--color-primary)' },
    { nome: 'Gerais', valor: resumo.totalDespesasGerais, fill: 'var(--color-mustard)' },
  ];
  // Valores legados negativos permanecem na alternativa textual; uma rosca não os representa.
  const podeMostrarRosca = tipos.every(item => item.valor >= 0) && resumo.totalDespesas > 0;
  return <>
    <div className={styles.panels}>
      <section className={styles.panel} aria-labelledby="evolucao-titulo">
        <h2 id="evolucao-titulo">Evolução no período</h2><p>Fretes previstos e despesas por mês, em reais.</p>
        {detalhes.meses.length ? <div role="region" aria-label="Evolução mensal">
          <div className={styles.graph}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 640, height: 300 }}>
              <BarChart data={detalhes.meses} accessibilityLayer margin={{ top: 12, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="var(--color-divider)" vertical={false} />
                <XAxis dataKey="mes" tickFormatter={mesLabel} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={eixoMonetario} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip formatter={value => moeda(Number(value))} labelFormatter={label => mesLabel(String(label))} contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-soft)' }} />
                <Legend iconType="circle" formatter={value => <span style={{ color: 'var(--color-text-muted)' }}>{value}</span>} />
                <Bar dataKey="fretes" name="Fretes previstos" fill="var(--color-primary)" radius={[5, 5, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                <Bar dataKey="despesas" name="Despesas" fill="var(--color-mustard)" radius={[5, 5, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className={styles.chartData}><summary>Ver valores mensais</summary><div className={styles.chartScroll} tabIndex={0} role="region" aria-label="Tabela mensal"><table className={styles.chart}>
            <caption>Valores mensais em reais</caption><thead><tr><th scope="col">Mês</th><th scope="col">Fretes previstos</th><th scope="col">Despesas</th></tr></thead>
            <tbody>{detalhes.meses.map(item => <tr key={item.mes}><th scope="row">{mesLabel(item.mes)}</th><td>{moeda(item.fretes)}</td><td>{moeda(item.despesas)}</td></tr>)}</tbody>
          </table></div></details>
        </div> : <p>Nenhum registro com data neste período.</p>}
        {detalhes.semData && <p>Registros sem data entram nos totais sem limites de período, mas não na evolução mensal.</p>}
      </section>
      <section className={styles.panel} aria-labelledby="composicao-titulo">
        <h2 id="composicao-titulo">Composição das despesas</h2><p>Participação de cada tipo no total selecionado.</p>
        {podeMostrarRosca ? <div className={styles.donut} role="img" aria-label={`Despesas de viagens: ${moeda(resumo.totalDespesasViagens)}. Despesas gerais: ${moeda(resumo.totalDespesasGerais)}.`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 220 }}>
            <PieChart><Pie data={tipos} dataKey="valor" nameKey="nome" innerRadius={66} outerRadius={92} paddingAngle={2} stroke="var(--color-surface)" isAnimationActive={false} />
              <Tooltip formatter={value => moeda(Number(value))} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div> : <p>{resumo.totalDespesas === 0 && tipos.every(item => item.valor === 0) ? 'Nenhuma despesa para compor o gráfico.' : 'A composição em rosca não representa valores negativos. Consulte os totais abaixo.'}</p>}
        <dl className={styles.breakdown}>{tipos.map(item => <div key={item.nome}><dt><i aria-hidden="true" style={{ background: item.fill }} />{item.nome}</dt><dd>{moeda(item.valor)}{podeMostrarRosca && <span>{(item.valor / resumo.totalDespesas * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>}</dd></div>)}</dl>
      </section>
    </div>
    <section className={styles.panel} aria-labelledby="categorias-titulo">
      <h2 id="categorias-titulo">Despesas por categoria</h2><p>Despesas gerais e de viagens combinadas, em reais.</p>
      {detalhes.categorias.length ? <>
        <div className={styles.categoryScroll} role="region" aria-label="Gráfico por categoria" tabIndex={0}><div className={styles.categoryGraph} style={{ height: Math.max(220, detalhes.categorias.length * 48) }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 640, height: 220 }}>
            <BarChart data={detalhes.categorias} layout="vertical" accessibilityLayer margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="var(--color-divider)" horizontal={false} />
              <XAxis type="number" tickFormatter={eixoMonetario} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" width={130} tickFormatter={nome => String(nome).length > 19 ? `${String(nome).slice(0, 18)}…` : String(nome)} tick={{ fill: 'var(--color-deep)', fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
              <Tooltip formatter={value => moeda(Number(value))} contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-soft)' }} />
              <Bar dataKey="valor" name="Despesas" fill="var(--color-primary)" radius={[0, 5, 5, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div></div>
        <details className={styles.chartData}><summary>Ver valores por categoria</summary><dl className={styles.breakdown}>{detalhes.categorias.map(item => <div key={item.nome}><dt>{item.nome}</dt><dd>{moeda(item.valor)}</dd></div>)}</dl></details>
      </> : <p>Nenhuma despesa registrada neste período.</p>}
    </section>
  </>;
}
