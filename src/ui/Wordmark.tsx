/** Marca: un chip visto desde arriba + nombre en serif. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" rx="6" style={{ fill: 'var(--c-primary)' }} />
        <rect x="10" y="10" width="12" height="12" rx="2" fill="none" strokeWidth="2.5" style={{ stroke: 'var(--c-on-primary)' }} />
        <path
          d="M13 3v4M19 3v4M13 25v4M19 25v4M3 13h4M3 19h4M25 13h4M25 19h4"
          strokeWidth="2"
          style={{ stroke: 'var(--c-canvas)' }}
        />
      </svg>
      {!compact && (
        <span className="font-serif text-[1.15rem] font-semibold tracking-[-0.01em] text-ink">
          PC Master 3D
        </span>
      )}
    </span>
  );
}
