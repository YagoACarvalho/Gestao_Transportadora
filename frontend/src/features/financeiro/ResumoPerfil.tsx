import { useEffect, useId, useState } from 'react';
import { Button, Card, LinkButton } from '../../ui';
import { viagensApi } from '../viagens/viagensApi';
import { despesasApi } from '../despesas/despesasApi';
import { agruparOperacao } from './operacao';
import type { GrupoOperacional, TipoPerfil } from './operacao';
import { DetalhesOperacionais } from './RelacoesOperacionais';
import type { Viagem } from '../viagens/types';
import type { Despesa } from '../despesas/types';
import styles from '../../components/Cadastro.module.css';
import perfil from '../motoristas/PerfilMotorista.module.css';

export function ResumoPerfil({ tipo, id }: { tipo: TipoPerfil; id: string }) {
  const prefix = useId();
  const initial = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  const [inicio, setInicio] = useState(initial.get('inicio') ?? '');
  const [fim, setFim] = useState(initial.get('fim') ?? '');
  const [dados, setDados] = useState<{ viagens: Viagem[]; despesas: Despesa[] }>();
  const [erro, setErro] = useState(''); const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setDados(undefined); setErro('');
    Promise.all([viagensApi.listar(controller.signal), despesasApi.listar(controller.signal)])
      .then(([viagens, despesas]) => { if (!controller.signal.aborted) setDados({ viagens, despesas }); })
      .catch(() => { if (!controller.signal.aborted) setErro('Não foi possível carregar os vínculos do perfil.'); });
    return () => controller.abort();
  }, [tipo, id, revision]);
  const invalido = !!(inicio && fim && inicio > fim);
  let grupo: GrupoOperacional | undefined;
  if (dados && !invalido) {
    const grupos = agruparOperacao(dados.viagens, dados.despesas, inicio, fim);
    grupo = (tipo === 'motorista' ? grupos.motoristas : grupos.caminhoes).find(item => item.id === id);
  }
  return <section className={perfil.operacao} aria-label="Operação do perfil">
    <Card span={12} title="Período do perfil">
      <div className={perfil.filters}>
        <div className={styles.field}><label htmlFor={`${prefix}-inicio`}>Data inicial</label><input id={`${prefix}-inicio`} type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></div>
        <div className={styles.field}><label htmlFor={`${prefix}-fim`}>Data final</label><input id={`${prefix}-fim`} type="date" value={fim} onChange={e => setFim(e.target.value)} /></div>
        <Button variant="secondary" onClick={() => { setInicio(''); setFim(''); }}>Todo o histórico</Button>
        <Button variant="secondary" onClick={() => setRevision(r => r + 1)}>Atualizar operação</Button>
        <LinkButton href={`#/financeiro?${new URLSearchParams({ ...(inicio ? { inicio } : {}), ...(fim ? { fim } : {}) })}`}>Ver dashboard no período</LinkButton>
      </div>
      <p className={perfil.note}>Os filtros atualizam os totais e as listas. Registros sem data aparecem apenas sem limites de período. As correlações usam os vínculos atuais das viagens, sem distribuir despesas gerais entre motoristas.</p>
    </Card>
    {invalido ? <p role="alert" className={styles.error}>A data inicial está depois da data final. Ajuste o período.</p>
      : erro ? <Card span={12}><p role="alert" className={styles.error}>{erro}</p><Button variant="secondary" onClick={() => setRevision(r => r + 1)}>Recarregar operação</Button></Card>
        : !dados ? <p role="status">Carregando operação do perfil…</p> : <DetalhesOperacionais key={`${tipo}-${id}-${inicio}-${fim}`} tipo={tipo} grupo={grupo} inicio={inicio} fim={fim} />}
  </section>;
}
