import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react';
import styles from './components.module.css';
import { Button as LeangeButton } from './leange/src/components/ui/button';
import { Card as LeangeCard } from './leange/src/components/ui/card';
import { Badge as LeangeBadge } from './leange/src/components/ui/badge';
import { EmptyState as LeangeEmptyState } from './leange/src/components/ui/empty-state';
import { DotsThreeIcon } from '@phosphor-icons/react/dist/csr/DotsThree';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import type { ComponentProps } from 'react';
import segments from './leange/src/components/ui/segmented-control/segmented-control.module.css';
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
  return <header className={styles.header}><div><h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h1>{subtitle && <p className={styles.subtitle}>{subtitle}</p>}</div>{actions && <div className={styles.actions}>{actions}</div>}</header>;
}

export function Grid({ children }: { children: ReactNode }) { return <div className={styles.grid}>{children}</div>; }

export function Card({ title, variant, span = 4, onMenu, className, children, ...rest }: {
  title?: string; variant?: 'navy'; span?: Span; onMenu?: () => void; className?: string; children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'title'>) {
  return <LeangeCard {...rest} title={title} action={onMenu && <LeangeButton variant="ghost" iconOnly aria-label={`Opções de ${title}`} onClick={onMenu}><DotsThreeIcon /></LeangeButton>} className={join(styles[`span${span}`], variant && styles.featured, className)}>{children}</LeangeCard>;
}

export function Badge({ tone = 'neutral', children }: { tone?: 'positive' | 'negative' | 'neutral' | 'warning'; children: ReactNode }) {
  return <LeangeBadge tone={tone === 'positive' ? 'success' : tone === 'negative' ? 'danger' : tone}>{children}</LeangeBadge>;
}

export function Button({ variant = 'primary', icon, children, className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'icon'; icon?: ReactNode; ref?: Ref<HTMLButtonElement> }) {
  return <LeangeButton {...rest} type={type} variant={variant === 'icon' ? 'ghost' : variant} iconStart={icon} className={className}>{children}</LeangeButton>;
}

export function LinkButton({ children, className, variant = 'secondary', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: 'primary' | 'secondary' }) {
  return <LeangeButton {...(rest as unknown as ComponentProps<typeof LeangeButton>)} href={rest.href ?? '#'} variant={variant} className={join(styles.linkButton, className)}>{children}</LeangeButton>;
}

export function CollectionHeader({ title, count, description }: { title: string; count?: number; description: string }) {
  return <div className={styles.collectionHeader}><div><h2>{title}</h2><p>{description}</p></div>{count !== undefined && <Badge>{count} {count === 1 ? 'registro' : 'registros'}</Badge>}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <LeangeEmptyState icon={MagnifyingGlassIcon} title={title} description={description} size="sm" />;
}

/** Forma SVG compartilhada pelos gráficos; aceita barras em ambos os sentidos. */
export function ChartBar({ x = 0, y = 0, width = 0, height = 0, fill }: { x?: number; y?: number; width?: number; height?: number; fill?: string }) {
  return <rect x={width < 0 ? x + width : x} y={height < 0 ? y + height : y} width={Math.abs(width)} height={Math.abs(height)} rx="var(--radius-md)" fill={fill} />;
}

/** Totais do conjunto carregado, sem mostrar zero durante carregamento ou falha. */
export function CollectionSummary({ items, loading, error }: { items: { title: string; value: number; description: string }[]; loading: boolean; error: string }) {
  return <div className={styles.collectionSummary}><Grid>{items.map((item, index) => <Card key={item.title} span={items.length === 4 ? 3 : 4} variant={index === 0 ? 'navy' : undefined}>
    <div className={styles.cardHead}><h2>{item.title}</h2></div><strong className={styles.value}>{loading || error ? '—' : item.value.toLocaleString('pt-BR')}</strong><p className={styles.caption}>{loading ? 'Carregando registros…' : error ? 'Dados indisponíveis' : item.description}</p>
  </Card>)}</Grid></div>;
}

/** Grupo de filtros, sem simular tabpanels que não existem. */
export function Tabs<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  return <div className={segments.segmented} role="group" aria-label={label}>{options.map(option => <Button key={option.value} variant="secondary" className={segments.segment} data-on={option.value === value || undefined} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>{option.label}</Button>)}</div>;
}

export function Avatar({ src, name }: { src?: string; name: string }) {
  return src ? <img className={styles.avatar} src={src} alt={name} /> : <span className={styles.avatar} role="img" aria-label={name}>{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>;
}

export function StatCard({ title, value, change, changeLabel = 'vs último mês', variant, span = 4 }: { title: string; value: string; change?: string; changeLabel?: string; variant?: 'navy'; span?: Span }) {
  return <Card title={title} variant={variant} span={span}><div className={styles.kpi}><span className={styles.value}>{value}</span>{change && <><Badge tone={change.trim().startsWith('-') ? 'negative' : 'positive'}>{change}</Badge><span className={styles.caption}>{changeLabel}</span></>}</div></Card>;
}
