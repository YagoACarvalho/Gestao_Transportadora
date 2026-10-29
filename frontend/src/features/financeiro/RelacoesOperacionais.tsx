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
    {grupos.length ? <div className={styles.tableScroll} role="region" aria-label={`Comparativo ${titulo.toLowerCase()}`} tabIndex={0}><table className={styles.table}>
      <caption className={styles.srOnly}>{titulo}: viagens, fretes e despesas no período</caption>
      <thead><tr><th scope="col">{tipo === 'motorista' ? 'Motorista' : 'Caminhão'}</th><th scope="col">Viagens</th><th scope="col">Fretes previstos</th><th scope="col">Despesas</th><th scope="col">{tipo === 'motorista' ? 'Remuneração incluída' : 'Despesas gerais incluídas'}</th><th scope="col">Perfil</th></tr></thead>
      <tbody>{grupos.map(grupo => <tr key={grupo.id ?? 'nao-atribuidos'}><th scope="row">{grupo.nome}</th><td>{grupo.viagens.length}</td><td className={styles.numeric}>{valorOperacional(grupo.fretes)}</td><td className={styles.numeric}>{valorOperacional(grupo.gastos)}</td><td className={styles.numeric}>{valorOperacional(tipo === 'motorista' ? grupo.remuneracao : grupo.gastosDiretos)}</td><td>{grupo.id ? <LinkButton href={perfilUrl(tipo, grupo.id, inicio, fim)} aria-label={`Abrir perfil de ${grupo.nome}`}>Ver perfil</LinkButton> : 'Sem vínculo para abrir'}</td></tr>)}</tbody>
    </table></div> : <EmptyState title="Nenhum vínculo neste período." description="Amplie o período para consultar viagens e despesas relacionadas." />}
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
      {viagens.length ? <div className={styles.tableScroll} role="region" aria-label="Viagens do período" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Percurso</th><th scope="col">Data</th><th scope="col">Situação</th><th scope="col">Frete previsto</th><th scope="col">Detalhes</th></tr></thead><tbody>{viagens.map(v => <tr key={v.id}><th scope="row">{v.origem || 'Origem não informada'} → {v.destino || 'Destino não informado'}<span className={styles.secondary}>{v.motoristaNome || 'Motorista não informado'} · {v.caminhaoPlaca || 'Caminhão não informado'}</span></th><td>{formatarData(v.dataViagem)}</td><td><Badge>{v.status || 'Não informada'}</Badge></td><td>{valorOperacional(v.valorFrete)}{v.status === 'Cancelada' && <span className={styles.secondary}>Excluído do total de fretes</span>}</td><td><Button variant="secondary" onClick={() => setSelecionada(v)} aria-label={`Detalhes da viagem ${v.origem} para ${v.destino}`}>Ver viagem</Button></td></tr>)}</tbody></table></div> : <p>Nenhuma viagem neste período.</p>}
    </Card>
    <Card span={12} title="Despesas do período">
      {despesas.length ? <div className={styles.tableScroll} role="region" aria-label="Despesas do período" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Lançamento</th><th scope="col">Data</th><th scope="col">Vínculo</th><th scope="col">Valor</th></tr></thead><tbody>{despesas.map(d => <tr key={d.id}><th scope="row">{d.descricao || 'Descrição não informada'}<span className={styles.secondary}>{d.categoria || 'Categoria não informada'}{d.origem === 'RemuneracaoMotorista' ? ' · Remuneração automática' : ''}</span></th><td>{formatarData(d.dataDespesa)}</td><td>{d.viagemId ? 'Viagem' : 'Despesa geral do caminhão'}</td><td>{valorOperacional(d.valor)}</td></tr>)}</tbody></table></div> : <p>Nenhuma despesa incluída no financeiro neste período.</p>}
      <LinkButton href="#/despesas">Gerenciar despesas</LinkButton>
    </Card>
    {selecionada && <SidePanel title="Detalhes da viagem" busy={false} onClose={() => setSelecionada(undefined)}><ViagemDetails viagem={selecionada} onExpense={() => { window.location.hash = `#/despesas?viagemId=${encodeURIComponent(selecionada.id)}`; }} /></SidePanel>}
  </>;
}
