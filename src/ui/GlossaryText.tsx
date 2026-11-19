import { useEffect, useId, useRef, useState } from 'react';
import { glossary } from '../content/glossary';

/**
 * Pinta un párrafo convirtiendo [[clave]] o [[clave|texto]] en términos del
 * glosario: subrayados con puntos y con su definición al tocarlos.
 */
export function GlossaryText({ text }: { text: string }) {
  const parts: (string | { key: string; label: string })[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ key: m[1], label: m[2] ?? glossary[m[1]]?.term ?? m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : glossary[p.key] ? (
          <Term key={i} termKey={p.key} label={p.label} />
        ) : (
          <span key={i}>{p.label}</span>
        ),
      )}
    </>
  );
}

function Term({ termKey, label }: { termKey: string; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const entry = glossary[termKey];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="font-[inherit] text-[inherit] text-ink underline decoration-dotted decoration-2 decoration-primary underline-offset-[5px] hover:text-primary"
      >
        {label}
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="absolute left-0 top-full z-30 mt-2 block w-[min(20rem,80vw)] rounded-xl border border-line bg-surface p-4 font-sans text-[0.95rem] leading-snug text-ink shadow-lg"
        >
          <span className="block font-bold mb-1">{entry.term}</span>
          <span className="block text-muted">{entry.definition}</span>
        </span>
      )}
    </span>
  );
}
