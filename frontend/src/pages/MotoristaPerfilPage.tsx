import { useEffect, useRef, useState } from 'react';
import { Avatar, Badge, Button, Card, EmptyState, Grid, LinkButton, PageHeader, StatCard, Tabs } from '../ui';
import { SidePanel } from '../components/SidePanel';
import { MotoristaForm } from '../features/motoristas/MotoristaForm';
import { motoristasApi } from '../features/motoristas/motoristasApi';
import { formatarDataCivil } from '../features/motoristas/types';
import type { CriarMotorista, Motorista } from '../features/motoristas/types';
import { remuneracaoDoMotorista, viagensDoMotorista } from '../features/motoristas/perfilMotorista';
import { viagensApi } from '../features/viagens/viagensApi';
import { formatarData, situacoes } from '../features/viagens/types';
import type { Viagem } from '../features/viagens/types';
import { ViagemDetails } from '../features/viagens/ViagemDetails';
import { despesasApi } from '../features/despesas/despesasApi';
import { moeda } from '../features/despesas/types';
import type { Despesa } from '../features/despesas/types';
import cadastro from '../components/Cadastro.module.css';
import styles from '../features/motoristas/PerfilMotorista.module.css';
import { ResumoPerfil } from '../features/financeiro/ResumoPerfil';

type Consulta<T> = { estado: 'carregando' } | { estado: 'erro'; mensagem: string } | { estado: 'pronto'; dados: T };
export type AbaMotorista = 'cadastro' | 'viagens' | 'remuneracao' | 'resumo';
const mensagem = (failure: unknown) => failure instanceof Error ? failure.message : 'Não foi possível carregar os dados. Tente novamente.';
const valor = (total: number | null) => total === null || !Number.isFinite(total) ? 'Não informado' : moeda(total);

export function MotoristaPerfilPage({ motoristaId, aba = 'cadastro' }: { motoristaId: string; aba?: AbaMotorista }) {
  const [motorista, setMotorista] = useState<Consulta<Motorista>>({ estado: 'carregando' });
  const [viagens, setViagens] = useState<Consulta<Viagem[]>>({ estado: 'carregando' });
  const [despesas, setDespesas] = useState<Consulta<Despesa[]>>({ estado: 'carregando' });
  const [revision, setRevision] = useState(0);
  const [inicio, setInicio] = useState(''); const [fim, setFim] = useState(''); const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false); const saving = useRef(false);
  const [feedback, setFeedback] = useState(''); const [selecionada, setSelecionada] = useState<Viagem>();
  const consultarViagens = aba === 'viagens' || aba === 'remuneracao'; const consultarDespesas = aba === 'remuneracao';
  const invalido = !!(inicio && fim && inicio > fim);

  useEffect(() => {
    let atual = true; setMotorista({ estado: 'carregando' });
    motoristasApi.obter(motoristaId).then(dados => { if (atual) setMotorista({ estado: 'pronto', dados }); })
      .catch(failure => { if (atual) setMotorista({ estado: 'erro', mensagem: mensagem(failure) }); });
    return () => { atual = false; };
  }, [motoristaId, revision]);
  useEffect(() => {
    if (motorista.estado !== 'pronto' || !consultarViagens) return;
    const controller = new AbortController(); setViagens({ estado: 'carregando' });
    viagensApi.listar(controller.signal).then(dados => { if (!controller.signal.aborted) setViagens({ estado: 'pronto', dados }); })
      .catch(failure => { if (!controller.signal.aborted) setViagens({ estado: 'erro', mensagem: mensagem(failure) }); });
    return () => controller.abort();
  }, [motoristaId, motorista, consultarViagens]);
  useEffect(() => {
    if (motorista.estado !== 'pronto' || !consultarDespesas) return;
    const controller = new AbortController(); setDespesas({ estado: 'carregando' });
    despesasApi.listar(controller.signal).then(dados => { if (!controller.signal.aborted) setDespesas({ estado: 'pronto', dados }); })
      .catch(failure => { if (!controller.signal.aborted) setDespesas({ estado: 'erro', mensagem: mensagem(failure) }); });
    return () => controller.abort();
  }, [motoristaId, motorista, consultarDespesas]);

  async function save(body: CriarMotorista & { ativo?: boolean }) {
    if (motorista.estado !== 'pronto' || saving.current) return;
    saving.current = true; setBusy(true);
    try {
      await motoristasApi.atualizar(motoristaId, { ...body, ativo: body.ativo ?? motorista.dados.ativo });
      setEditing(false); setFeedback('Cadastro do motorista atualizado.'); setRevision(value => value + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  function trocarAba(nova: AbaMotorista) {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    params.set('motoristaId', motoristaId); params.set('aba', nova);
    window.location.hash = `#/motoristas?${params}`;
  }
  const lista = viagens.estado === 'pronto' ? viagensDoMotorista(motoristaId, viagens.dados, inicio, fim, status) : [];
  const remuneracao = viagens.estado === 'pronto' && despesas.estado === 'pronto'
    ? remuneracaoDoMotorista(motoristaId, viagens.dados, despesas.dados, inicio, fim) : undefined;

  return <>
    <PageHeader title={motorista.estado === 'pronto' ? motorista.dados.nome || 'Nome não informado' : 'Perfil do motorista'} subtitle="Cadastro, viagens, fretes, despesas e remuneração prevista."
      actions={<LinkButton href="#/motoristas">Voltar para motoristas</LinkButton>} />
    {feedback && <p role="status" className={cadastro.feedback}>{feedback}</p>}
    {motorista.estado === 'carregando' ? <Card span={12}><p role="status">Carregando perfil do motorista…</p></Card>
      : motorista.estado === 'erro' ? <Card span={12}><div role="alert" className={cadastro.error}>{motorista.mensagem}</div><Button variant="secondary" onClick={() => setRevision(value => value + 1)}>Tentar novamente</Button></Card>
        : <>
          <div className={styles.navigation}><Tabs label="Seções do perfil" value={aba} onChange={trocarAba} options={[
            { value: 'cadastro', label: 'Cadastro' }, { value: 'resumo', label: 'Operação e despesas' }, { value: 'viagens', label: 'Viagens' }, { value: 'remuneracao', label: 'Remuneração' },
          ]} /><Button variant="secondary" disabled={busy} onClick={() => setRevision(value => value + 1)}>Atualizar perfil</Button></div>

          {aba === 'resumo' ? <ResumoPerfil tipo="motorista" id={motoristaId} /> : aba === 'cadastro' ? <Card span={12} aria-label="Dados cadastrais">
            <div className={styles.identity}><Avatar name={motorista.dados.nome || 'Motorista'} /><div><h2>Dados cadastrais</h2><Badge tone={motorista.dados.ativo ? 'positive' : 'neutral'}>{motorista.dados.ativo ? 'Ativo' : 'Inativo'}</Badge></div></div>
            <dl className={cadastro.details}>
              <div><dt>Nome</dt><dd>{motorista.dados.nome}</dd></div><div><dt>Telefone</dt><dd>{motorista.dados.telefone || 'Não informado'}</dd></div>
              <div><dt>CPF</dt><dd>{motorista.dados.cpf || 'Não informado'}</dd></div><div><dt>Número da CNH</dt><dd>{motorista.dados.numeroCnh || 'Não informado'}</dd></div>
              <div><dt>Categoria da CNH</dt><dd>{motorista.dados.categoriaCnh || 'Não informada'}</dd></div><div><dt>Validade da CNH</dt><dd>{formatarDataCivil(motorista.dados.dataValidadeCnh)}</dd></div>
            </dl><Button disabled={busy} onClick={() => { setFeedback(''); setEditing(true); }}>Editar cadastro</Button>
          </Card> : <Card span={12} aria-label={aba === 'viagens' ? 'Viagens do motorista' : 'Remuneração do motorista'} title={aba === 'viagens' ? 'Viagens vinculadas' : 'Remuneração das viagens'}>
            <p className={styles.note}>{aba === 'viagens' ? 'Consulte os percursos atualmente vinculados a este motorista, em qualquer situação.' : 'Valores previstos dos lançamentos automáticos registrados. Não representam pagamentos realizados.'}</p>
            <div className={styles.filters} role="group" aria-label="Filtros do perfil">
              <div className={cadastro.field}><label htmlFor="perfil-inicio">Data inicial</label><input id="perfil-inicio" type="date" value={inicio} onChange={event => setInicio(event.target.value)} /></div>
              <div className={cadastro.field}><label htmlFor="perfil-fim">Data final</label><input id="perfil-fim" type="date" value={fim} onChange={event => setFim(event.target.value)} /></div>
              {aba === 'viagens' && <div className={cadastro.field}><label htmlFor="perfil-situacao">Situação da viagem</label><select id="perfil-situacao" value={status} onChange={event => setStatus(event.target.value)}><option value="">Todas</option>{situacoes.map(situacao => <option key={situacao}>{situacao}</option>)}</select></div>}
              <Button variant="secondary" onClick={() => { setInicio(''); setFim(''); setStatus(''); }}>Limpar filtros</Button>
            </div>
            <p className={styles.note}>O período considera {aba === 'viagens' ? 'a data da viagem' : 'a data do lançamento de remuneração'}. Registros sem data aparecem apenas sem limites de período.</p>
            {invalido ? <p role="alert" className={cadastro.error}>A data inicial está depois da data final. Ajuste o período.</p>
              : viagens.estado === 'carregando' ? <p role="status">Carregando viagens do motorista…</p>
                : viagens.estado === 'erro' ? <div role="alert"><p className={cadastro.error}>{viagens.mensagem}</p><Button variant="secondary" onClick={() => setRevision(value => value + 1)}>Recarregar viagens</Button></div>
                  : aba === 'viagens' ? lista.length ? <Grid>{lista.map(viagem => <Card key={viagem.id} span={6} className={styles.trip}>
                    <div className={styles.tripTop}><h3>{viagem.origem || 'Origem não informada'} → {viagem.destino || 'Destino não informado'}</h3><Badge tone={viagem.status === 'Concluída' ? 'positive' : viagem.status === 'Pausada' ? 'warning' : viagem.status === 'Cancelada' ? 'negative' : 'neutral'}>{viagem.status || 'Não informada'}</Badge></div>
                    <div className={styles.tripMeta}><p>Data: {formatarData(viagem.dataViagem)}</p><p>Caminhão: {viagem.caminhaoPlaca || 'Não informado'}</p></div>
                    <p>Frete previsto: <strong>{valor(viagem.valorFrete)}</strong></p>
                    <div><Button variant="secondary" onClick={() => setSelecionada(viagem)} aria-label={`Ver viagem ${viagem.origem || 'sem origem'} para ${viagem.destino || 'sem destino'}`}>Ver detalhes</Button></div>
                  </Card>)}</Grid> : <EmptyState title="Nenhuma viagem encontrada para este motorista." description="Revise os filtros. As viagens aparecem conforme o motorista vinculado ao cadastro de cada percurso." />
                    : despesas.estado === 'carregando' ? <p role="status">Carregando remuneração do motorista…</p>
                      : despesas.estado === 'erro' ? <div role="alert"><p className={cadastro.error}>{despesas.mensagem}</p><Button variant="secondary" onClick={() => setRevision(value => value + 1)}>Recarregar remuneração</Button></div>
                        : remuneracao && <>
                          <div className={styles.stats}><Grid>
                            <StatCard title="Remuneração prevista" value={valor(remuneracao.totalPrevisto)} variant="navy" />
                            <StatCard title="Somente no histórico" value={valor(remuneracao.totalHistorico)} />
                            <StatCard title="Lançamentos no período" value={String(remuneracao.lancamentos.length)} />
                          </Grid></div>
                          <p className={styles.note}>A remuneração prevista soma os lançamentos incluídos no financeiro. Viagens canceladas respeitam a escolha de inclusão de cada despesa. Nenhum valor retroativo é estimado para viagens sem lançamento.</p>
                          {remuneracao.totalPrevisto === null || remuneracao.totalHistorico === null ? <p role="alert" className={cadastro.error}>Há lançamentos sem valor válido. O total correspondente não pode ser informado.</p> : null}
                          {remuneracao.lancamentos.length ? <div className={cadastro.tableScroll} role="region" aria-label="Lançamentos de remuneração" tabIndex={0}><table className={cadastro.table}>
                            <caption className={cadastro.srOnly}>Remuneração automática das viagens vinculadas</caption><thead><tr><th scope="col">Viagem</th><th scope="col">Data</th><th scope="col" className={cadastro.numeric}>Valor previsto</th><th scope="col">Inclusão financeira</th><th scope="col">Ação</th></tr></thead>
                            <tbody>{remuneracao.lancamentos.map(item => <tr key={item.id}><th scope="row">{item.percurso.origem || 'Origem não informada'} → {item.percurso.destino || 'Destino não informado'}<span className={cadastro.secondary}>{item.percurso.status || 'Situação não informada'}</span></th>
                              <td>{formatarData(item.dataDespesa)}</td><td className={cadastro.numeric}>{valor(item.valor)}</td><td><Badge tone={item.considerarNoFinanceiro === false ? 'neutral' : 'positive'}>{item.considerarNoFinanceiro === false ? 'Somente histórico' : 'Incluída'}</Badge></td>
                              <td><Button variant="secondary" onClick={() => setSelecionada(item.percurso)} aria-label={`Ver viagem ${item.percurso.origem || 'sem origem'} para ${item.percurso.destino || 'sem destino'}`}>Ver viagem</Button></td></tr>)}</tbody>
                          </table></div> : <EmptyState title="Nenhum lançamento automático neste período." description="Viagens antigas não geram remuneração retroativa. Ajuste o período para consultar outros lançamentos." />}
                        </>}
            <p className={styles.note}>Os vínculos são os atuais: mudar o motorista de uma viagem também muda sua associação neste perfil. Não há histórico separado de beneficiários.</p>
          </Card>}
          {editing && <SidePanel title="Editar motorista" busy={busy} onClose={() => setEditing(false)}><MotoristaForm motorista={motorista.dados} busy={busy} onSave={save} /></SidePanel>}
        </>}
    {selecionada && <SidePanel title="Detalhes da viagem" busy={false} onClose={() => setSelecionada(undefined)}><ViagemDetails viagem={selecionada} onExpense={() => { window.location.hash = `#/despesas?viagemId=${encodeURIComponent(selecionada.id)}`; }} /></SidePanel>}
  </>;
}
