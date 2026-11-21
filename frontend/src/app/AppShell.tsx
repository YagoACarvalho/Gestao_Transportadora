import { Button, ThemeSelector } from '../ui';
import { useEffect, useRef, useState } from 'react';
import { CascaApp, BarraSuperior } from '../ui/v2/base';
import { Sidebar } from '../components/Sidebar';
import type { Modulo } from '../components/Sidebar';
import { MotoristasPage } from '../pages/MotoristasPage';
import { MotoristaPerfilPage } from '../pages/MotoristaPerfilPage';
import type { AbaMotorista } from '../pages/MotoristaPerfilPage';
import { CaminhoesPage } from '../pages/CaminhoesPage';
import { CaminhaoPerfilPage } from '../pages/CaminhaoPerfilPage';
import { ViagensPage } from '../pages/ViagensPage';
import { DespesasPage } from '../pages/DespesasPage';
import { FinanceiroPage } from '../pages/FinanceiroPage';
import { CalcularFretePage } from '../pages/CalcularFretePage';
import { FechamentosPage } from '../pages/FechamentosPage';
import styles from './AppShell.module.css';

export function AppShell({ onSignOut }: { onSignOut?: () => Promise<void> }) {
  const readModulo = (): Modulo => {
    const value = window.location.hash.slice(2).split('?')[0];
    return value === 'viagens' || value === 'caminhoes' || value === 'despesas' || value === 'financeiro' || value === 'calcular-frete' || value === 'fechamentos' ? value : 'motoristas';
  };
  const [modulo, setModulo] = useState(readModulo);
  const [consulta, setConsulta] = useState(() => window.location.hash.split('?')[1] ?? '');
  const parametros = new URLSearchParams(consulta);
  const motoristaId = modulo === 'motoristas' ? parametros.get('motoristaId') : null;
  const caminhaoId = modulo === 'caminhoes' ? parametros.get('caminhaoId') : null;
  const periodoPerfil = `${parametros.get('inicio') ?? ''}-${parametros.get('fim') ?? ''}`;
  const abaInformada = parametros.get('aba');
  const abaMotorista: AbaMotorista = abaInformada === 'viagens' || abaInformada === 'remuneracao' || abaInformada === 'resumo' ? abaInformada : 'cadastro';
  const main = useRef<HTMLDivElement>(null);
  const title = motoristaId ? 'Perfil do motorista' : caminhaoId ? 'Perfil do caminhão' : { viagens: 'Viagens', caminhoes: 'Caminhões', motoristas: 'Motoristas', despesas: 'Despesas', financeiro: 'Resumo financeiro', 'calcular-frete': 'Calcular frete', fechamentos: 'Fechamentos' }[modulo];
  useEffect(() => {
    const navigate = () => { if (window.location.hash !== '#conteudo') { setModulo(readModulo()); setConsulta(window.location.hash.split('?')[1] ?? ''); } };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.title = `${title} | Gestão de Transportadora`;
    main.current?.focus({ preventScroll: true });
  }, [title, motoristaId, caminhaoId]);

  return (
    <CascaApp variante="reta" larguraCelular={900} rotuloPular="Ir para o conteúdo" menu={<Sidebar modulo={modulo} />} barra={<BarraSuperior titulo={title} bordaAoRolar={false} acoes={<div className={styles.themeActions}><ThemeSelector />{onSignOut && <Button variant="secondary" onClick={onSignOut}>Sair</Button>}</div>} />}>
        <div ref={main} id="conteudo" tabIndex={-1} className={styles.content}>
          {modulo === 'fechamentos' ? <FechamentosPage /> : modulo === 'calcular-frete' ? <CalcularFretePage key={consulta} /> : modulo === 'viagens' ? <ViagensPage /> : modulo === 'caminhoes' ? caminhaoId ? <CaminhaoPerfilPage key={`${caminhaoId}-${periodoPerfil}`} caminhaoId={caminhaoId} /> : <CaminhoesPage /> : modulo === 'despesas' ? <DespesasPage key={consulta} /> : modulo === 'financeiro' ? <FinanceiroPage /> : motoristaId ? <MotoristaPerfilPage key={`${motoristaId}-${periodoPerfil}`} motoristaId={motoristaId} aba={abaMotorista} /> : <MotoristasPage />}
        </div>
        <footer className={styles.footer}><span>Gestão de Transportadora</span><span>Cadastros, operação e financeiro</span></footer>
    </CascaApp>
  );
}
