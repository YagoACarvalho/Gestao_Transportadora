import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react';
import styles from './components.module.css';
import { Botao, Cartao, CartaoCabecalho, CartaoCorpo, Selo, EstadoVazio, CabecalhoPagina, GrupoAlternavel, ItemAlternavel, Avatar as AvatarV2 } from './v2/base';
import { Ellipsis, Search } from 'lucide-react';
import buttonStyles from './v2/base/componentes/Botao/Botao.module.css';
import { MolduraIndicador, GradeIndicadores, ValorIndicador, RodapeIndicador } from './v2/indicadores';
export * from './v2/indicadores';
export { Input, Select, Textarea } from './Fields';
export { Table, TableHeadCell, TableCell } from './Table';
export { ThemeSelector } from './ThemeSelector';

type Span = 3 | 4 | 5 | 6 | 7 | 12;
const join = (...names: (string | undefined)[]) => names.filter(Boolean).join(' ');

/** Estrutura visual; autenticação e navegação continuam sob responsabilidade da aplicação. */
export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={join(styles.shell, className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions, headingRef }: { title: string; subtitle?: string; actions?: ReactNode; headingRef?: Ref<HTMLHeadingElement> }) {
  return <CabecalhoPagina titulo={title} refTitulo={headingRef} descricao={subtitle} acoes={actions} className={styles.header} />;
}

export function Grid({ children }: { children: ReactNode }) { return <div className={styles.grid}>{children}</div>; }

export function Card({ title, variant, span = 4, onMenu, className, children, ...rest }: {
  title?: string; variant?: 'navy'; span?: Span; onMenu?: () => void; className?: string; children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'title'>) {
  return <Cartao {...rest} como="section" variante={variant ? 'destaque' : 'padrao'} className={join(styles[`span${span}`], className)}>{title && <CartaoCabecalho titulo={title} nivelTitulo={2} acoes={onMenu && <Botao variante="fantasma" aria-label={`Opções de ${title}`} onClick={onMenu}><Ellipsis /></Botao>} />}<CartaoCorpo data-ui-card-body>{children}</CartaoCorpo></Cartao>;
}

export function Badge({ tone = 'neutral', children }: { tone?: 'positive' | 'negative' | 'neutral' | 'warning'; children: ReactNode }) {
  return <Selo tom={tone === 'positive' ? 'verde' : tone === 'negative' ? 'vermelho' : tone === 'warning' ? 'laranja' : 'cinza'} style={{ color: `var(${tone === 'positive' ? '--app-sucesso-texto' : tone === 'negative' ? '--app-perigo-texto' : tone === 'warning' ? '--app-aviso-texto' : '--aleph-texto-suave'})` }}>{children}</Selo>;
}

export function Button({ variant = 'primary', icon, children, className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'icon'; icon?: ReactNode; ref?: Ref<HTMLButtonElement> }) {
  return <Botao {...rest} type={type} variante={variant === 'icon' ? 'fantasma' : variant === 'secondary' ? 'suave' : 'solido'} iconeEsquerda={icon} className={className}>{children}</Botao>;
}

export function LinkButton({ children, className, variant = 'secondary', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: 'primary' | 'secondary' }) {
  return <a {...rest} data-variante={variant === 'primary' ? 'solido' : 'suave'} data-tom="neutro" data-tamanho="medio" data-forma="pilula" className={join(buttonStyles.botao, styles.linkButton, className)}>{children}</a>;
}

export function CollectionHeader({ title, count, description }: { title: string; count?: number; description: string }) {
  return <div className={styles.collectionHeader}><div><h2>{title}</h2><p>{description}</p></div>{count !== undefined && <Badge>{count} {count === 1 ? 'registro' : 'registros'}</Badge>}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <EstadoVazio icone={<Search />} titulo={title} descricao={description} tamanho="pequeno" />;
}

/** Forma SVG compartilhada pelos gráficos; aceita barras em ambos os sentidos. */
export function ChartBar({ x = 0, y = 0, width = 0, height = 0, fill }: { x?: number; y?: number; width?: number; height?: number; fill?: string }) {
  return <rect x={width < 0 ? x + width : x} y={height < 0 ? y + height : y} width={Math.abs(width)} height={Math.abs(height)} rx="var(--aleph-raio-m)" fill={fill} />;
}

/** Totais do conjunto carregado, sem mostrar zero durante carregamento ou falha. */
export function CollectionSummary({ items, loading, error }: { items: { title: string; value: number; description: string }[]; loading: boolean; error: string }) {
  return <div className={styles.collectionSummary}><GradeIndicadores colunas={items.length === 4 ? 4 : 3}>{items.map(item => <MolduraIndicador key={item.title} rotulo={item.title}><ValorIndicador valor={loading || error ? '—' : item.value.toLocaleString('pt-BR')} /><RodapeIndicador nota={loading ? 'Carregando registros…' : error ? 'Dados indisponíveis' : item.description} /></MolduraIndicador>)}</GradeIndicadores></div>;
}

/** Grupo de filtros, sem simular tabpanels que não existem. */
export function Tabs<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  return <GrupoAlternavel rotulo={label} valor={value} obrigatorio onMudar={next => { if (next) onChange(next as T); }}>{options.map(option => <ItemAlternavel key={option.value} valor={option.value} rotulo={option.label}>{option.label}</ItemAlternavel>)}</GrupoAlternavel>;
}

export function Avatar({ src, name }: { src?: string; name: string }) {
  return <AvatarV2 nome={name} src={src} style={{ color: 'var(--aleph-texto-padrao)' }} />;
}

export function StatCard({ title, value, change, changeLabel = 'vs último mês', variant, span = 4 }: { title: string; value: string; change?: string; changeLabel?: string; variant?: 'navy'; span?: Span }) {
  return <div className={styles[`span${span}`]} data-destaque={variant || undefined}><MolduraIndicador rotulo={title}><ValorIndicador valor={value} comparacao={change && <><Badge tone={change.trim().startsWith('-') ? 'negative' : 'positive'}>{change}</Badge> {changeLabel}</>} /></MolduraIndicador></div>;
}
