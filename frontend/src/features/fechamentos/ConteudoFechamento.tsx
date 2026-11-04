import { Card, Grid } from '../../ui';
import { moeda } from '../despesas/types';
import { formatarData } from '../viagens/types';
import type { PreviaFechamento } from './fechamentosApi';
import styles from './Fechamentos.module.css';

export function ConteudoFechamento({ conteudo }: { conteudo: PreviaFechamento }) {
  const { totais: t, filtros: f } = conteudo;
  return <div className={styles.stack}>
    <p>Período: {formatarData(f.dataInicial)} a {formatarData(f.dataFinal)}. Motorista: {conteudo.motoristaNome ?? 'Todos'}. Caminhão: {conteudo.caminhaoPlaca ?? 'Todos'}.</p>
    <p>Situações: {f.situacoes.length ? f.situacoes.join(', ') : 'Todas, incluindo legados'}. Categoria: {f.categoria ?? 'Todas'}. Despesas gerais: {f.incluirDespesasGerais ? 'Solicitadas, conforme os vínculos dos filtros' : 'Não incluídas'}.</p>
    <Grid><Card span={4} variant="navy" title="Resultado do fechamento"><strong className={styles.total}>{moeda(t.resultado)}</strong><p>Fretes menos despesas incluídas</p></Card>
      <Card span={4} title="Fretes"><strong className={styles.total}>{moeda(t.totalFretes)}</strong><p>{t.quantidadeViagens} viagens na conferência; canceladas não geram receita.</p></Card>
      <Card span={4} title="Despesas"><strong className={styles.total}>{moeda(t.totalDespesas)}</strong><p>{t.quantidadeDespesas} lançamentos incluídos no financeiro.</p></Card></Grid>
    <Card title="Composição das despesas" span={12}><dl className={styles.breakdown}><div><dt>Despesas de viagens</dt><dd>{moeda(t.totalDespesasViagens)}</dd></div><div><dt>Despesas gerais</dt><dd>{moeda(t.totalDespesasGerais)}</dd></div><div><dt>Remuneração automática, já incluída nas despesas de viagens</dt><dd>{moeda(t.totalRemuneracaoMotoristas)}</dd></div></dl></Card>
    {conteudo.avisos.map(a => <p key={a} className={styles.notice}>{a}</p>)}
    <details open className={styles.details}><summary>Viagens que compõem a conferência</summary><div className={styles.scroll} tabIndex={0} role="region" aria-label="Viagens do fechamento"><table className={styles.table}><thead><tr><th>Data</th><th>Trajeto</th><th>Motorista / caminhão</th><th>Situação</th><th>Frete</th></tr></thead><tbody>{conteudo.viagens.map(v => <tr key={v.id}><td>{formatarData(v.dataViagem)}</td><td>{v.origem ?? 'Não informada'} → {v.destino ?? 'Não informado'}</td><td>{v.motoristaNome ?? 'Sem motorista'} / {v.caminhaoPlaca ?? 'Sem caminhão'}</td><td>{v.situacao?.trim() || 'Legado sem situação'}{!v.incluidaNaReceita && ' (fora da receita)'}</td><td>{v.valorFrete === null ? 'Não informado' : moeda(v.valorFrete)}</td></tr>)}</tbody></table>{!conteudo.viagens.length && <p>Nenhuma viagem atende aos filtros.</p>}</div></details>
    <details className={styles.details}><summary>Despesas que compõem o resultado</summary><div className={styles.scroll} tabIndex={0} role="region" aria-label="Despesas do fechamento"><table className={styles.table}><thead><tr><th>Data</th><th>Lançamento</th><th>Vínculo</th><th>Motorista / caminhão</th><th>Valor</th></tr></thead><tbody>{conteudo.despesas.map(d => <tr key={d.id}><td>{formatarData(d.dataDespesa)}</td><td>{d.descricao ?? 'Sem descrição'}<small>{d.categoria ?? 'Sem categoria'}{d.origem === 'RemuneracaoMotorista' ? ' · Remuneração automática' : ''}</small></td><td>{d.viagemId ? 'De viagem' : 'Geral'}{d.situacaoViagem === 'Cancelada' ? ' · viagem cancelada, custo mantido' : ''}</td><td>{d.motoristaNome ?? 'Não atribuído'} / {d.caminhaoPlaca ?? 'Não atribuído'}</td><td>{d.valor === null ? 'Não informado' : moeda(d.valor)}</td></tr>)}</tbody></table>{!conteudo.despesas.length && <p>Nenhuma despesa incluída atende aos filtros.</p>}</div></details>
  </div>;
}
