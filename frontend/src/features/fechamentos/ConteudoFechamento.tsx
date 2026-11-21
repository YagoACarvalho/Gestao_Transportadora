import { Table, TableHeadCell, TableCell } from '../../ui';
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
    <details open className={styles.details}><summary>Viagens que compõem a conferência</summary><div className={styles.scroll} tabIndex={0} role="region" aria-label="Viagens do fechamento"><Table className={styles.table}><thead><tr><TableHeadCell>Data</TableHeadCell><TableHeadCell>Trajeto</TableHeadCell><TableHeadCell>Motorista / caminhão</TableHeadCell><TableHeadCell>Situação</TableHeadCell><TableHeadCell>Frete</TableHeadCell></tr></thead><tbody>{conteudo.viagens.map(v => <tr key={v.id}><TableCell>{formatarData(v.dataViagem)}</TableCell><TableCell>{v.origem ?? 'Não informada'} → {v.destino ?? 'Não informado'}</TableCell><TableCell>{v.motoristaNome ?? 'Sem motorista'} / {v.caminhaoPlaca ?? 'Sem caminhão'}</TableCell><TableCell>{v.situacao?.trim() || 'Legado sem situação'}{!v.incluidaNaReceita && ' (fora da receita)'}</TableCell><TableCell>{v.valorFrete === null ? 'Não informado' : moeda(v.valorFrete)}</TableCell></tr>)}</tbody></Table>{!conteudo.viagens.length && <p>Nenhuma viagem atende aos filtros.</p>}</div></details>
    <details className={styles.details}><summary>Despesas que compõem o resultado</summary><div className={styles.scroll} tabIndex={0} role="region" aria-label="Despesas do fechamento"><Table className={styles.table}><thead><tr><TableHeadCell>Data</TableHeadCell><TableHeadCell>Lançamento</TableHeadCell><TableHeadCell>Vínculo</TableHeadCell><TableHeadCell>Motorista / caminhão</TableHeadCell><TableHeadCell>Valor</TableHeadCell></tr></thead><tbody>{conteudo.despesas.map(d => <tr key={d.id}><TableCell>{formatarData(d.dataDespesa)}</TableCell><TableCell>{d.descricao ?? 'Sem descrição'}<small>{d.categoria ?? 'Sem categoria'}{d.origem === 'RemuneracaoMotorista' ? ' · Remuneração automática' : ''}</small></TableCell><TableCell>{d.viagemId ? 'De viagem' : 'Geral'}{d.situacaoViagem === 'Cancelada' ? ' · viagem cancelada, custo mantido' : ''}</TableCell><TableCell>{d.motoristaNome ?? 'Não atribuído'} / {d.caminhaoPlaca ?? 'Não atribuído'}</TableCell><TableCell>{d.valor === null ? 'Não informado' : moeda(d.valor)}</TableCell></tr>)}</tbody></Table>{!conteudo.despesas.length && <p>Nenhuma despesa incluída atende aos filtros.</p>}</div></details>
  </div>;
}
