import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return <Tag className={`card p-4 sm:p-5 ${className}`}>{children}</Tag>;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "#37c97e",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: IconName;
  accent?: string;
}) {
  return (
    <div className="card flex items-start gap-3 p-4">
      {icon && (
        <span
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-ink-faint">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-bold leading-tight text-ink sm:text-2xl">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
      </div>
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Badge({
  children,
  color = "#37c97e",
  tone = "soft",
}: {
  children: ReactNode;
  color?: string;
  tone?: "soft" | "solid" | "outline";
}) {
  if (tone === "solid") {
    return (
      <span className="badge text-canvas" style={{ background: color }}>
        {children}
      </span>
    );
  }
  if (tone === "outline") {
    return (
      <span
        className="badge border"
        style={{ borderColor: `${color}66`, color }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className="badge"
      style={{ background: `${color}1f`, color }}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon = "alert",
  title,
  hint,
  children,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-500/10 text-forest-300">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-muted">{hint}</p>}
      {children}
    </div>
  );
}

/** A row label/value used in detail/profile cards. */
export function DetailRow({
  icon,
  label,
  children,
}: {
  icon?: IconName;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && (
        <span className="mt-0.5 text-ink-faint">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      )}
      <span className="w-24 shrink-0 text-sm text-ink-faint">{label}</span>
      <span className="min-w-0 break-words text-sm text-ink">{children}</span>
    </div>
  );
}
