import "./components.css";
import type { ReactNode } from "react";

/* ---------- Estrutura ---------- */

type NavItem = { label: string; href: string; active?: boolean };

export function AppShell({
  brand,
  nav,
  right,
  children,
}: {
  brand: ReactNode;
  nav: NavItem[];
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ul-page">
      <div className="ul-surface">
        <header className="ul-topbar">
          <div className="ul-brand">{brand}</div>
          <nav className="ul-nav" aria-label="Principal">
            {nav.map((item) => (
              <a key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ul-topbar-right">{right}</div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="ul-page-header">
      <div>
        <h1 className="ul-page-title">{title}</h1>
        {subtitle && <p className="ul-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ul-actions">{actions}</div>}
    </div>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="ul-grid">{children}</div>;
}

/* ---------- Card ---------- */

export function Card({
  title,
  variant,
  span = 4,
  onMenu,
  children,
}: {
  title?: string;
  variant?: "navy";
  span?: 3 | 4 | 5 | 6 | 7 | 12;
  onMenu?: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`ul-card ul-col-${span}${variant ? ` ul-card--${variant}` : ""}`}>
      {title && (
        <div className="ul-card-head">
          <h2 className="ul-card-title">{title}</h2>
          <button className="ul-menu-btn" aria-label={`Opções de ${title}`} onClick={onMenu}>
            ⋯
          </button>
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- Badge, Pill, Button, Tabs ---------- */

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "positive" | "negative" | "neutral";
  children: ReactNode;
}) {
  return <span className={`ul-badge ul-badge--${tone}`}>{children}</span>;
}

export function Button({
  variant = "primary",
  icon,
  children,
  ...rest
}: {
  variant?: "primary" | "secondary" | "icon";
  icon?: ReactNode;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`ul-btn ul-btn--${variant}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="ul-tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          className="ul-pill"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Avatar e ListRow ---------- */

export function Avatar({ src, name }: { src?: string; name: string }) {
  return <img className="ul-avatar" src={src} alt={name} />;
}

export function ListRow({
  avatar,
  title,
  description,
  tag,
}: {
  avatar?: string;
  title: string;
  description?: string;
  tag: string;
}) {
  return (
    <div className="ul-row">
      <div className="ul-row-main">
        <Avatar src={avatar} name={title} />
        <div>
          <div className="ul-row-title">{title}</div>
          {description && <div className="ul-caption">{description}</div>}
        </div>
      </div>
      <span className="ul-row-tag">{tag}</span>
    </div>
  );
}

/* ---------- KPIs ---------- */

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs último mês",
  variant,
  span = 4,
}: {
  title: string;
  value: string;
  change?: string;
  changeLabel?: string;
  variant?: "navy";
  span?: 3 | 4 | 5 | 6 | 7 | 12;
}) {
  const negative = change?.trim().startsWith("-");
  return (
    <Card title={title} variant={variant} span={span}>
      <div className="ul-kpi">
        <span className="ul-kpi-value">{value}</span>
        {change && <Badge tone={negative ? "negative" : "positive"}>{change}</Badge>}
        {change && <span className="ul-caption">{changeLabel}</span>}
      </div>
    </Card>
  );
}

export function ProgressCard({
  title,
  value,
  percent,
  change,
  footerLeft,
  footerRight,
  controls,
  span = 4,
}: {
  title: string;
  value: string;
  percent: number;
  change?: string;
  footerLeft?: string;
  footerRight?: string;
  controls?: ReactNode;
  span?: 3 | 4 | 5 | 6 | 7 | 12;
}) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <Card title={title} span={span}>
      {controls}
      <div className="ul-spread">
        <span className="ul-kpi-value">{value}</span>
        {change && <Badge tone="positive">{change}</Badge>}
      </div>
      <div className="ul-progress" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
        <span className="ul-stripes" style={{ width: `${p}%` }} />
      </div>
      <div className="ul-spread ul-caption">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </Card>
  );
}

/* ---------- Gráficos ---------- */

function mix(a: [number, number, number], b: [number, number, number], t: number) {
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

/** Medidor semicircular segmentado (ex.: "Customers Volume"). value: 0–100 */
export function GaugeChart({
  value,
  label,
  caption,
  segments = 24,
}: {
  value: number;
  label: string;
  caption?: ReactNode;
  segments?: number;
}) {
  const cx = 160, cy = 160, r1 = 100, r2 = 150;
  const active = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);
  return (
    <div className="ul-gauge">
      <svg viewBox="0 0 320 175" role="img" aria-label={`${label}: ${value}%`}>
        {Array.from({ length: segments }, (_, i) => {
          const a = Math.PI + ((i + 0.5) / segments) * Math.PI;
          const on = i < active;
          return (
            <line
              key={i}
              x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
              strokeWidth={9} strokeLinecap="round"
              stroke={on ? mix([53, 181, 220], [160, 240, 190], i / Math.max(active - 1, 1)) : "#dfe5ec"}
            />
          );
        })}
      </svg>
      <div className="ul-gauge-center">
        <div className="ul-gauge-value">{label}</div>
        {caption && <div className="ul-caption">{caption}</div>}
      </div>
    </div>
  );
}

/** Barras verticais com selo de variação. A barra de maior valor fica em destaque. */
export function BarChartCard({
  title,
  controls,
  highlight,
  data,
  span = 7,
}: {
  title: string;
  controls?: ReactNode;
  highlight?: ReactNode;
  data: { label: string; value: number; change?: string }[];
  span?: 3 | 4 | 5 | 6 | 7 | 12;
}) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const top = data.reduce((m, d) => (d.value > m.value ? d : m), data[0]);
  return (
    <Card title={title} span={span}>
      {controls}
      <div className="ul-chart-layout">
        <div className="ul-chart-side">{highlight}</div>
        <div className="ul-bars">
          {data.map((d) => {
            const negative = d.change?.trim().startsWith("-");
            return (
              <div className="ul-bar-col" key={d.label}>
                {d.change && <Badge tone={negative ? "negative" : "positive"}>{d.change}</Badge>}
                <div
                  className={`ul-bar${negative ? " ul-bar--negative" : ""}`}
                  data-active={d === top}
                  style={{ height: `${(Math.abs(d.value) / max) * 75}%` }}
                />
                <span className="ul-caption">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
