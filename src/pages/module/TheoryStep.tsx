import { ArrowLeft, Lightbulb, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CourseModule, TheoryCard } from '../../content/modules';
import { desktopComponents } from '../../data/desktopComponents';
import { laptopComponents } from '../../data/laptopComponents';
import { motherboardComponents } from '../../data/motherboardComponents';
import { phoneComponents } from '../../data/phoneComponents';
import { completeTheory } from '../../lib/api';
import { readingSeconds } from '../../lib/courseLogic';
import LazyStage from '../../three/LazyStage';
import type { ComponentInfo, DeviceModelType } from '../../types/hardware';
import { Button } from '../../ui/Button';
import { ErrorNotice } from '../../ui/Feedback';
import { GlossaryText } from '../../ui/GlossaryText';

export const DEVICE_COMPONENTS: Record<DeviceModelType, ComponentInfo[]> = {
  desktop: desktopComponents,
  motherboard: motherboardComponents,
  laptop: laptopComponents,
  phone: phoneComponents,
};

function cardText(card: TheoryCard) {
  return [card.title, ...card.body, card.callout?.text ?? ''].join(' ').replace(/\[\[[^\]|]+\|?([^\]]*)\]\]/g, '$1');
}

interface Props {
  mod: CourseModule;
  alreadyDone: boolean;
  onFinished: () => Promise<void> | void;
}

export default function TheoryStep({ mod, alreadyDone, onFinished }: Props) {
  const cards = mod.theory;
  const [index, setIndex] = useState(0);
  const [maxSeen, setMaxSeen] = useState(alreadyDone ? cards.length - 1 : 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const card = cards[index];
  const isLast = index === cards.length - 1;
  const firstVisit = index >= maxSeen && !alreadyDone;
  const waitSeconds = useMemo(() => readingSeconds(cardText(card)), [card]);
  const [ready, setReady] = useState(!firstVisit);

  // Tiempo mínimo de lectura solo la primera vez que se ve cada tarjeta.
  useEffect(() => {
    if (!firstVisit) {
      setReady(true);
      return;
    }
    setReady(false);
    const t = window.setTimeout(() => setReady(true), waitSeconds * 1000);
    return () => window.clearTimeout(t);
  }, [index, firstVisit, waitSeconds]);

  const go = (next: number) => {
    setIndex(next);
    setMaxSeen((m) => Math.max(m, next));
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!alreadyDone) await completeTheory(mod.id);
      await onFinished();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <article aria-labelledby="theory-title" className="min-w-0">
        <p className="text-sm font-semibold text-muted tabular-nums" aria-live="polite">
          Idea {index + 1} de {cards.length}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {cards.map((c, i) => (
            <span
              key={c.id}
              className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-accent' : i === index ? 'bg-primary' : 'bg-secondary'}`}
            />
          ))}
        </div>

        <h2 id="theory-title" ref={headingRef} tabIndex={-1} className="mt-6 text-[1.75rem] outline-none">
          {card.title}
        </h2>
        <div className="reading mt-4 text-ink">
          {card.body.map((p, i) => (
            <p key={i}>
              <GlossaryText text={p} />
            </p>
          ))}
        </div>

        {card.callout && (
          <aside
            className={`mt-6 flex gap-3 rounded-xl border p-4 ${
              card.callout.kind === 'safety' ? 'border-danger/40 bg-danger-soft' : 'border-accent/50 bg-accent-soft'
            }`}
          >
            {card.callout.kind === 'safety' ? (
              <ShieldAlert className="size-5 shrink-0 text-danger mt-0.5" aria-hidden="true" />
            ) : (
              <Lightbulb className="size-5 shrink-0 text-accent-strong mt-0.5" aria-hidden="true" />
            )}
            <p className="leading-relaxed">
              <span className="font-bold">{card.callout.kind === 'safety' ? 'Seguridad. ' : 'Consejo. '}</span>
              {card.callout.text}
            </p>
          </aside>
        )}

        {error && <div className="mt-6"><ErrorNotice>{error}</ErrorNotice></div>}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {index > 0 && (
            <Button variant="ghost" onClick={() => go(index - 1)}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Anterior
            </Button>
          )}
          {isLast ? (
            <PacedButton ready={ready} seconds={waitSeconds} onClick={finish} disabled={busy}>
              {busy ? 'Guardando…' : alreadyDone ? 'Ir a las preguntas' : 'Terminé, ir a las preguntas'}
            </PacedButton>
          ) : (
            <PacedButton ready={ready} seconds={waitSeconds} onClick={() => go(index + 1)}>
              Siguiente idea
            </PacedButton>
          )}
        </div>
      </article>

      <div className="min-w-0 lg:pt-10">
        {card.visual ? (
          <figure>
            <div className="h-[min(26rem,62vw)] min-h-[16rem] w-full">
              <LazyStage
                key={`${card.visual.device}`}
                modelType={card.visual.device}
                components={DEVICE_COMPONENTS[card.visual.device]}
                selectedId={card.visual.componentId}
                explodeAmount={card.visual.explode ?? 0}
                showLabels={false}
                compact
                testId="theory-stage"
              />
            </div>
            <figcaption className="mt-3 text-sm text-muted">{card.visual.caption}</figcaption>
          </figure>
        ) : (
          <div className="hidden lg:flex h-full min-h-[16rem] items-center justify-center rounded-xl border border-dashed border-line-strong p-8 text-center text-muted">
            <p className="max-w-xs">
              Tómate un momento para pensar en un equipo que conozcas. ¿Dónde aplicarías esta idea?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Botón que se habilita tras un tiempo mínimo de lectura, mostrando el avance dentro del propio botón. */
function PacedButton({
  ready,
  seconds,
  onClick,
  disabled,
  children,
}: {
  ready: boolean;
  seconds: number;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!ready || disabled}
      aria-describedby={!ready ? 'paced-hint' : undefined}
      className="relative inline-flex h-12 items-center justify-center overflow-hidden rounded-[10px] bg-primary px-6 font-semibold text-on-primary disabled:cursor-not-allowed"
    >
      {!ready && (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-left bg-[color-mix(in_oklab,var(--c-surface)_45%,transparent)]"
          style={{ animation: `paced-fill ${seconds}s linear forwards` }}
        />
      )}
      <span className="relative">{children}</span>
      {!ready && (
        <span id="paced-hint" className="sr-only">
          Se habilita en unos segundos, para que tengas tiempo de leer.
        </span>
      )}
    </button>
  );
}
