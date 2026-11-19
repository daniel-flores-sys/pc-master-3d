import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { PALETTES, useTheme, type ModePreference } from '../theme/ThemeProvider';

const MODES: { id: ModePreference; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Claro', Icon: Sun },
  { id: 'dark', label: 'Oscuro', Icon: Moon },
  { id: 'system', label: 'Sistema', Icon: Monitor },
];

export function ThemeSwitcher() {
  const { palette, setPalette, modePreference, setModePreference, mode } = useTheme();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-ink hover:bg-secondary"
      >
        <Palette className="size-[18px]" aria-hidden="true" />
        <span className="hidden sm:inline">Apariencia</span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-4 shadow-xl"
        >
          <p className="text-sm font-bold text-ink mb-2" id={`${panelId}-palette`}>
            Paleta
          </p>
          <div role="radiogroup" aria-labelledby={`${panelId}-palette`} className="space-y-1.5">
            {PALETTES.map((p) => {
              const active = p.id === palette;
              const [c1, c2, c3] = p.swatches[mode];
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPalette(p.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                    active ? 'border-primary bg-primary-soft' : 'border-transparent hover:bg-secondary'
                  }`}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-md border border-line" aria-hidden="true">
                    <span className="size-5" style={{ background: c3 }} />
                    <span className="size-5" style={{ background: c1 }} />
                    <span className="size-5" style={{ background: c2 }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-ink">{p.name}</span>
                    <span className="block text-xs text-muted leading-snug">{p.description}</span>
                  </span>
                  {active && <Check className="size-4 text-primary shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <p className="text-sm font-bold text-ink mt-4 mb-2" id={`${panelId}-mode`}>
            Modo
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${panelId}-mode`}
            className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1"
          >
            {MODES.map(({ id, label, Icon }) => {
              const active = id === modePreference;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setModePreference(id)}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
