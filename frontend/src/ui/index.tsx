import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react';
import styles from './components.module.css';

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
  return <section {...rest} className={join(styles.card, styles[`span${span}`], variant && styles.navy, className)}>
    {title && <div className={styles.cardHead}><h2>{title}</h2>{onMenu && <Button variant="icon" aria-label={`Opções de ${title}`} onClick={onMenu}>⋯</Button>}</div>}{children}
  </section>;
}

export function Badge({ tone = 'neutral', children }: { tone?: 'positive' | 'negative' | 'neutral' | 'warning'; children: ReactNode }) {
  return <span className={join(styles.badge, styles[tone])}>{children}</span>;
}

export function Button({ variant = 'primary', icon, children, className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'icon'; icon?: ReactNode; ref?: Ref<HTMLButtonElement> }) {
  return <button {...rest} type={type} className={join(styles.button, styles[variant], className)}>{icon}{children}</button>;
}

export function LinkButton({ children, className, variant = 'secondary', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: 'primary' | 'secondary' }) {
  return <a {...rest} className={join(styles.button, styles[variant], className)}>{children}</a>;
}

export function CollectionHeader({ title, count, description }: { title: string; count?: number; description: string }) {
  return <div className={styles.collectionHeader}><div><h2>{title}</h2><p>{description}</p></div>{count !== undefined && <Badge>{count} {count === 1 ? 'registro' : 'registros'}</Badge>}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className={styles.emptyState}><span className={styles.emptyMark} aria-hidden="true">⌕</span><h3>{title}</h3><p>{description}</p></div>;
}

/** Forma SVG compartilhada pelos gráficos; aceita barras em ambos os sentidos. */
export function ChartBar({ x = 0, y = 0, width = 0, height = 0, fill }: { x?: number; y?: number; width?: number; height?: number; fill?: string }) {
  return <rect x={width < 0 ? x + width : x} y={height < 0 ? y + height : y} width={Math.abs(width)} height={Math.abs(height)} rx="var(--ul-radius-sm)" fill={fill} />;
}

/** Totais do conjunto carregado, sem mostrar zero durante carregamento ou falha. */
export function CollectionSummary({ items, loading, error }: { items: { title: string; value: number; description: string }[]; loading: boolean; error: string }) {
  return <div className={styles.collectionSummary}><Grid>{items.map((item, index) => <Card key={item.title} span={items.length === 4 ? 3 : 4} variant={index === 0 ? 'navy' : undefined}>
    <div className={styles.cardHead}><h2>{item.title}</h2></div><strong className={styles.value}>{loading || error ? '—' : item.value.toLocaleString('pt-BR')}</strong><p className={styles.caption}>{loading ? 'Carregando registros…' : error ? 'Dados indisponíveis' : item.description}</p>
  </Card>)}</Grid></div>;
}

/** Grupo de filtros, sem simular tabpanels que não existem. */
export function Tabs<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  return <div className={styles.tabs} role="group" aria-label={label}>{options.map(option => <Button key={option.value} variant="secondary" className={styles.pill} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>{option.label}</Button>)}</div>;
}

export function Avatar({ src, name }: { src?: string; name: string }) {
  return src ? <img className={styles.avatar} src={src} alt={name} /> : <span className={styles.avatar} role="img" aria-label={name}>{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>;
}

export function ListRow({ avatar, title, description, tag }: { avatar?: string; title: string; description?: string; tag: string }) {
  return <div className={styles.row}><div className={styles.rowMain}><Avatar src={avatar} name={title} /><div><strong>{title}</strong>{description && <div className={styles.caption}>{description}</div>}</div></div><Badge>{tag}</Badge></div>;
}

export function StatCard({ title, value, change, changeLabel = 'vs último mês', variant, span = 4 }: { title: string; value: string; change?: string; changeLabel?: string; variant?: 'navy'; span?: Span }) {
  return <Card title={title} variant={variant} span={span}><div className={styles.kpi}><span className={styles.value}>{value}</span>{change && <><Badge tone={change.trim().startsWith('-') ? 'negative' : 'positive'}>{change}</Badge><span className={styles.caption}>{changeLabel}</span></>}</div></Card>;
}

const percent = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
export function ProgressCard({ title, value, percent: progress, change, footerLeft, footerRight, controls, span = 4 }: { title: string; value: string; percent: number; change?: string; footerLeft?: string; footerRight?: string; controls?: ReactNode; span?: Span }) {
  const p = percent(progress);
  return <Card title={title} span={span}>{controls}<div className={styles.spread}><strong className={styles.value}>{value}</strong>{change && <Badge tone={change.startsWith('-') ? 'negative' : 'positive'}>{change}</Badge>}</div><div className={styles.progress} role="progressbar" aria-label={title} aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${p}%` }} /></div><div className={join(styles.spread, styles.caption)}><span>{footerLeft}</span><span>{footerRight}</span></div></Card>;
}

export function GaugeChart({ value, label, caption, segments = 24 }: { value: number; label: string; caption?: ReactNode; segments?: number }) {
  const count = Number.isFinite(segments) ? Math.max(1, Math.min(100, Math.round(segments))) : 24;
  const p = percent(value);
  return <div className={styles.gauge}><svg viewBox="0 0 320 175" role="img" aria-label={`${label}: ${p}%`}>{Array.from({ length: count }, (_, i) => {
    const angle = Math.PI + ((i + .5) / count) * Math.PI;
    return <line key={i} className={styles.segment} data-active={i < Math.round(p * count / 100)} x1={160 + 100 * Math.cos(angle)} y1={160 + 100 * Math.sin(angle)} x2={160 + 150 * Math.cos(angle)} y2={160 + 150 * Math.sin(angle)} strokeWidth={9} strokeLinecap="round" />;
  })}</svg><div className={styles.gaugeCenter}><strong className={styles.value}>{label}</strong>{caption && <div className={styles.caption}>{caption}</div>}</div></div>;
}

export function BarChartCard({ title, controls, highlight, data, span = 7 }: { title: string; controls?: ReactNode; highlight?: ReactNode; data: { label: string; value: number; change?: string }[]; span?: Span }) {
  const max = Math.max(...data.map(item => Math.abs(item.value)), 1);
  return <Card title={title} span={span}>{controls}{highlight}{data.length ? <><div className={styles.bars} aria-hidden="true">{data.map(item => <div key={item.label} className={styles.barColumn}><div className={styles.bar} data-negative={item.value < 0} style={{ height: `${Math.abs(item.value) / max * 75}%` }} /><span className={styles.caption}>{item.label}</span></div>)}</div><details><summary>Ver valores do gráfico</summary><dl>{data.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value.toLocaleString('pt-BR')}{item.change && ` (${item.change})`}</dd></div>)}</dl></details></> : <p className={styles.empty}>Nenhum valor disponível.</p>}</Card>;
}
