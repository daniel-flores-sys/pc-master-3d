import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-muted py-10 justify-center">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNotice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-xl border border-danger/40 bg-danger-soft p-4 text-ink">
      <AlertTriangle className="size-5 shrink-0 text-danger mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-[12rem]">{children}</div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 w-full rounded-full bg-secondary overflow-hidden"
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
