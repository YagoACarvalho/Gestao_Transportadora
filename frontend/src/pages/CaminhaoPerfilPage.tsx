import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, LinkButton, PageHeader } from '../ui';
import { caminhoesApi } from '../features/caminhoes/caminhoesApi';
import type { Caminhao, CriarCaminhao } from '../features/caminhoes/types';
import { CaminhaoForm } from '../features/caminhoes/CaminhaoForm';
import { SidePanel } from '../components/SidePanel';
import { ResumoPerfil } from '../features/financeiro/ResumoPerfil';
import styles from '../components/Cadastro.module.css';
import perfil from '../features/motoristas/PerfilMotorista.module.css';

export function CaminhaoPerfilPage({ caminhaoId }: { caminhaoId: string }) {
  const [caminhao, setCaminhao] = useState<Caminhao>(); const [erro, setErro] = useState('');
  const [revision, setRevision] = useState(0); const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false); const saving = useRef(false);
  useEffect(() => {
    let atual = true; setCaminhao(undefined); setErro('');
    caminhoesApi.obter(caminhaoId).then(item => { if (atual) setCaminhao(item); })
      .catch(() => { if (atual) setErro('Não foi possível carregar o perfil do caminhão.'); });
    return () => { atual = false; };
  }, [caminhaoId, revision]);
  async function save(body: CriarCaminhao & { ativo?: boolean }) {
    if (!caminhao || saving.current) return;
    saving.current = true; setBusy(true);
    try {
      await caminhoesApi.atualizar(caminhaoId, { ...body, ativo: body.ativo ?? caminhao.ativo });
      setEditing(false); setRevision(r => r + 1);
    } finally { saving.current = false; setBusy(false); }
  }
  return <>
    <PageHeader title={caminhao?.placa || 'Perfil do caminhão'} subtitle="Cadastro, motoristas, viagens, fretes e despesas do veículo." actions={<LinkButton href="#/caminhoes">Voltar para caminhões</LinkButton>} />
    {erro ? <Card span={12}><p role="alert" className={styles.error}>{erro}</p><Button variant="secondary" onClick={() => setRevision(r => r + 1)}>Tentar novamente</Button></Card>
      : !caminhao ? <p role="status">Carregando perfil do caminhão…</p> : <div className={perfil.operacao}>
        <Card span={12} title="Dados do caminhão"><Badge tone={caminhao.ativo ? 'positive' : 'neutral'}>{caminhao.ativo ? 'Ativo' : 'Inativo'}</Badge>
          <dl className={styles.details}><div><dt>Placa</dt><dd>{caminhao.placa}</dd></div><div><dt>Modelo</dt><dd>{caminhao.modelo || 'Não informado'}</dd></div></dl>
          <Button onClick={() => setEditing(true)}>Editar caminhão</Button>
        </Card>
        <ResumoPerfil key={revision} tipo="caminhao" id={caminhaoId} />
      </div>}
    {editing && caminhao && <SidePanel title="Editar caminhão" busy={busy} onClose={() => setEditing(false)}><CaminhaoForm caminhao={caminhao} busy={busy} onSave={save} /></SidePanel>}
  </>;
}
