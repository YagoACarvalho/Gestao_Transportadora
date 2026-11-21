import { CircleUserRound as UserCircleIcon, Truck as TruckIcon, Route as PathIcon, Calculator as CalculatorIcon, Receipt as ReceiptIcon, ChartColumn as ChartBarIcon, ClipboardList as ClipboardTextIcon } from 'lucide-react';
import { MenuLateral, SecaoMenuLateral, ItemMenuLateral } from '../ui/v2/base';
import styles from './Sidebar.module.css';
export type Modulo = 'motoristas' | 'caminhoes' | 'viagens' | 'despesas' | 'financeiro' | 'calcular-frete' | 'fechamentos';
const groups = [
 { title: 'Cadastros', items: [{ id: 'motoristas', label: 'Motoristas', icon: UserCircleIcon }, { id: 'caminhoes', label: 'Caminhões', icon: TruckIcon }] },
 { title: 'Operação', items: [{ id: 'viagens', label: 'Viagens', icon: PathIcon }, { id: 'calcular-frete', label: 'Calcular frete', icon: CalculatorIcon }] },
 { title: 'Financeiro', items: [{ id: 'despesas', label: 'Despesas', icon: ReceiptIcon }, { id: 'financeiro', label: 'Resumo financeiro', icon: ChartBarIcon }, { id: 'fechamentos', label: 'Fechamentos', icon: ClipboardTextIcon }] },
];
export function Sidebar({ modulo, onNavigate }: { modulo: Modulo; onNavigate?: () => void }) {
 return <MenuLateral valor={modulo} recolhivel={false} registrarAtalhos={false} cabecalho={<div className={styles.brand}><span className={styles.brandMark} aria-hidden="true">GT</span><span>Gestão de<br />Transportadora</span></div>} rodape={<div className={styles.footer}>Organização para cada etapa do transporte.</div>}>
   {groups.map(group => <SecaoMenuLateral key={group.title} titulo={group.title}>{group.items.map(({ id, label, icon: Icon }) => <ItemMenuLateral key={id} valor={id} href={`#/${id}`} icone={<Icon size={18} />} onSelecionar={onNavigate}>{label}</ItemMenuLateral>)}</SecaoMenuLateral>)}
 </MenuLateral>;
}
