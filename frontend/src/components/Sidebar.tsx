import { UserCircleIcon } from '@phosphor-icons/react/dist/csr/UserCircle';
import { TruckIcon } from '@phosphor-icons/react/dist/csr/Truck';
import { PathIcon } from '@phosphor-icons/react/dist/csr/Path';
import { CalculatorIcon } from '@phosphor-icons/react/dist/csr/Calculator';
import { ReceiptIcon } from '@phosphor-icons/react/dist/csr/Receipt';
import { ChartBarIcon } from '@phosphor-icons/react/dist/csr/ChartBar';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/csr/ClipboardText';
import styles from './Sidebar.module.css';
export type Modulo = 'motoristas' | 'caminhoes' | 'viagens' | 'despesas' | 'financeiro' | 'calcular-frete' | 'fechamentos';
const groups = [
 { title: 'Cadastros', items: [{ id: 'motoristas', label: 'Motoristas', icon: UserCircleIcon }, { id: 'caminhoes', label: 'Caminhões', icon: TruckIcon }] },
 { title: 'Operação', items: [{ id: 'viagens', label: 'Viagens', icon: PathIcon }, { id: 'calcular-frete', label: 'Calcular frete', icon: CalculatorIcon }] },
 { title: 'Financeiro', items: [{ id: 'despesas', label: 'Despesas', icon: ReceiptIcon }, { id: 'financeiro', label: 'Resumo financeiro', icon: ChartBarIcon }, { id: 'fechamentos', label: 'Fechamentos', icon: ClipboardTextIcon }] },
];
export function Sidebar({ modulo, onNavigate }: { modulo: Modulo; onNavigate?: () => void }) {
 return <div className={styles.sidebar}>
  <div className={styles.brand}><span className={styles.brandMark} aria-hidden="true">GT</span><span>Gestão de<br />Transportadora</span></div>
  <nav aria-label="Navegação principal" className={styles.navigation}>{groups.map(group => <div key={group.title}><p className={styles.label}>{group.title}</p>{group.items.map(({ id, label, icon: Icon }) => <a key={id} href={`#/${id}`} aria-current={modulo === id ? 'page' : undefined} onClick={onNavigate} className={`${styles.link} ${modulo === id ? styles.active : ''}`}><Icon size={20} aria-hidden="true" />{label}</a>)}</div>)}</nav>
  <div className={styles.footer}>Organização para cada etapa do transporte.</div>
 </div>;
}
