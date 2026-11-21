import { Table, TableHeadCell, TableCell } from '../../ui';
import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Grid, LinkButton, StatCard } from '../../ui';
import { SidePanel } from '../../components/SidePanel';
import { ViagemDetails } from '../viagens/ViagemDetails';
import { formatarData } from '../viagens/types';
import type { Viagem } from '../viagens/types';
import { moeda } from '../despesas/types';
import type { GrupoOperacional, TipoPerfil } from './operacao';
import { perfilUrl } from './operacao';
import styles from '../../components/Cadastro.module.css';
import perfil from '../motoristas/PerfilMotorista.module.css';

export const valorOperacional = (value: number | null) => value === null ? 'Não informado' : moeda(value);

export function ComparativoOperacional({ tipo, grupos, inicio, fim }: { tipo: TipoPerfil; grupos: GrupoOperacional[]; inicio: string; fim: string }) {
  const titulo = tipo === 'motorista' ? 'Por motorista' : 'Por caminhão';
  return <Card span={12} aria-label={titulo} title={titulo}>
    {grupos.length ? <div className={styles.tableScroll} role="region" aria-label={`Comparativo ${titulo.toLowerCase()}`} tabIndex={0}><Table className={styles.table}>
      <caption className={styles.srOnly}>{titulo}: viagens, fretes e despesas no período</caption>
      <thead><tr><TableHeadCell scope="col">{tipo === 'motorista' ? 'Motorista' : 'Caminhão'}</TableHeadCell><TableHeadCell scope="col">Viagens</TableHeadCell><TableHeadCell scope="col">Fretes previstos</TableHeadCell><TableHeadCell scope="col">Despesas</TableHeadCell><TableHeadCell scope="col">{tipo === 'motorista' ? 'Remuneração incluída' : 'Despesas gerais incluídas'}</TableHeadCell><TableHeadCell scope="col">Perfil</TableHeadCell></tr></thead>
      <tbody>{grupos.map(grupo => <tr key={grupo.id ?? 'nao-atribuidos'}><TableHeadCell scope="row">{grupo.nome}</TableHeadCell><TableCell>{grupo.viagens.length}</TableCell><TableCell className={styles.numeric}>{valorOperacional(grupo.fretes)}</TableCell><TableCell className={styles.numeric}>{valorOperacional(grupo.gastos)}</TableCell><TableCell className={styles.numeric}>{valorOperacional(tipo === 'motorista' ? grupo.remuneracao : grupo.gastosDiretos)}</TableCell><TableCell>{grupo.id ? <LinkButton href={perfilUrl(tipo, grupo.id, inicio, fim)} aria-label={`Abrir perfil de ${grupo.nome}`}>Ver perfil</LinkButton> : 'Sem vínculo para abrir'}</TableCell></tr>)}</tbody>
    </Table></div> : <EmptyState title="Nenhum vínculo neste período." description="Amplie o período para consultar viagens e despesas relacionadas." />}
  </Card>;
}

export function DetalhesOperacionais({ grupo, tipo, inicio, fim }: { grupo?: GrupoOperacional; tipo: TipoPerfil; inicio: string; fim: string }) {
  const [selecionada, setSelecionada] = useState<Viagem>();
  const viagens = grupo?.viagens ?? []; const despesas = grupo?.despesas ?? [];
  const relacionados = [...new Map(viagens.filter(v => tipo === 'motorista' ? v.caminhaoId : v.motoristaId).map(v => tipo === 'motorista'
    ? [v.caminhaoId!, { id: v.caminhaoId!, nome: v.caminhaoPlaca || 'Caminhão não informado' }]
    : [v.motoristaId!, { id: v.motoristaId!, nome: v.motoristaNome || 'Motorista não informado' }])).values()];
  return <>
    <div className={perfil.stats}><Grid>
      <StatCard title="Viagens no período" value={String(viagens.length)} />
      <StatCard title="Fretes previstos no período" value={valorOperacional(grupo ? grupo.fretes : 0)} variant="navy" />
      <StatCard title="Despesas no período" value={valorOperacional(grupo ? grupo.gastos : 0)} />
      <StatCard title={tipo === 'motorista' ? 'Remuneração incluída nas despesas' : 'Despesas gerais incluídas'} value={valorOperacional(grupo ? tipo === 'motorista' ? grupo.remuneracao : grupo.gastosDiretos : 0)} />
    </Grid></div>
    <p className={perfil.note}>Fretes pela data da viagem, excluindo canceladas. Gastos pela data da despesa, somente incluídos no financeiro. Remuneração e despesas gerais destacadas já fazem parte das despesas. Valores previstos, sem confirmação de recebimento ou pagamento.</p>
    {grupo && [grupo.fretes, grupo.gastos, grupo.remuneracao, grupo.gastosDiretos].includes(null) && <p role="alert" className={styles.error}>Há registros sem valor válido. Os totais correspondentes não podem ser informados.</p>}
    <Card span={12} title={tipo === 'motorista' ? 'Caminhões das viagens' : 'Motoristas das viagens'}>
      {relacionados.length ? <div className={styles.actions}>{relacionados.map(item => <LinkButton key={item.id} href={perfilUrl(tipo === 'motorista' ? 'caminhao' : 'motorista', item.id, inicio, fim)}>{item.nome}</LinkButton>)}</div> : <p>Nenhum cadastro relacionado às viagens deste período.</p>}
    </Card>
    <Card span={12} title="Viagens do período">
      {viagens.length ? <div className={styles.tableScroll} role="region" aria-label="Viagens do período" tabIndex={0}><Table className={styles.table}><thead><tr><TableHeadCell scope="col">Percurso</TableHeadCell><TableHeadCell scope="col">Data</TableHeadCell><TableHeadCell scope="col">Situação</TableHeadCell><TableHeadCell scope="col">Frete previsto</TableHeadCell><TableHeadCell scope="col">Detalhes</TableHeadCell></tr></thead><tbody>{viagens.map(v => <tr key={v.id}><TableHeadCell scope="row">{v.origem || 'Origem não informada'} → {v.destino || 'Destino não informado'}<span className={styles.secondary}>{v.motoristaNome || 'Motorista não informado'} · {v.caminhaoPlaca || 'Caminhão não informado'}</span></TableHeadCell><TableCell>{formatarData(v.dataViagem)}</TableCell><TableCell><Badge>{v.status || 'Não informada'}</Badge></TableCell><TableCell>{valorOperacional(v.valorFrete)}{v.status === 'Cancelada' && <span className={styles.secondary}>Excluído do total de fretes</span>}</TableCell><TableCell><Button variant="secondary" onClick={() => setSelecionada(v)} aria-label={`Detalhes da viagem ${v.origem} para ${v.destino}`}>Ver viagem</Button></TableCell></tr>)}</tbody></Table></div> : <p>Nenhuma viagem neste período.</p>}
    </Card>
    <Card span={12} title="Despesas do período" aria-labelledby={undefined}>
      {despesas.length ? <div className={styles.tableScroll} role="region" aria-label="Despesas do período" tabIndex={0}><Table className={styles.table}><thead><tr><TableHeadCell scope="col">Lançamento</TableHeadCell><TableHeadCell scope="col">Data</TableHeadCell><TableHeadCell scope="col">Vínculo</TableHeadCell><TableHeadCell scope="col">Valor</TableHeadCell></tr></thead><tbody>{despesas.map(d => <tr key={d.id}><TableHeadCell scope="row">{d.descricao || 'Descrição não informada'}<span className={styles.secondary}>{d.categoria || 'Categoria não informada'}{d.origem === 'RemuneracaoMotorista' ? ' · Remuneração automática' : ''}</span></TableHeadCell><TableCell>{formatarData(d.dataDespesa)}</TableCell><TableCell>{d.viagemId ? 'Viagem' : 'Despesa geral do caminhão'}</TableCell><TableCell>{valorOperacional(d.valor)}</TableCell></tr>)}</tbody></Table></div> : <p>Nenhuma despesa incluída no financeiro neste período.</p>}
      <LinkButton href="#/despesas">Gerenciar despesas</LinkButton>
    </Card>
    {selecionada && <SidePanel title="Detalhes da viagem" busy={false} onClose={() => setSelecionada(undefined)}><ViagemDetails viagem={selecionada} onExpense={() => { window.location.hash = `#/despesas?viagemId=${encodeURIComponent(selecionada.id)}`; }} /></SidePanel>}
  </>;
}
