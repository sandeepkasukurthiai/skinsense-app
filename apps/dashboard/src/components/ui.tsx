import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="h-display text-4xl lg:text-5xl">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-semibold text-plum-deep">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Badge({ children, tone = "plum" }: { children: ReactNode; tone?: "plum" | "gold" | "ok" | "warn" | "danger" | "muted" }) {
  const tones = {
    plum: "bg-lilac text-plum",
    gold: "bg-champagne text-[#6b4a1e]",
    ok: "bg-[#e7f3ec] text-ok",
    warn: "bg-[#fbefe0] text-warn",
    danger: "bg-[#fbe9e8] text-danger",
    muted: "bg-[#f3eef2] text-muted",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-2xl text-plum-deep">{title}</p>
      {body ? <p className="mt-2 text-sm text-muted">{body}</p> : null}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card space-y-3 p-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-5 animate-pulse rounded bg-lilac" />
      ))}
    </div>
  );
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="h-display text-2xl font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
