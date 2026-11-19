import { Check, CheckCircle2, Eye, PartyPopper, ShieldCheck, Wrench, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { courseModules, type CourseModule, type PracticeSpec } from '../../content/modules';
import { faultCases } from '../../data/educationData';
import { maintenanceTutorials } from '../../data/workshopData';
import { completePractice } from '../../lib/api';
import { readingSeconds } from '../../lib/courseLogic';
import LazyStage from '../../three/LazyStage';
import { Button, buttonClass } from '../../ui/Button';
import { ErrorNotice } from '../../ui/Feedback';
import { DEVICE_COMPONENTS } from './TheoryStep';

interface Props {
  mod: CourseModule;
  alreadyDone: boolean;
  onCompleted: () => Promise<void> | void;
}

export default function PracticeStep({ mod, alreadyDone, onCompleted }: Props) {
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(alreadyDone);

  const save = async () => {
    setFinished(true);
    if (saved) return;
    setSaving(true);
    setError(null);
    try {
      await completePractice(mod.id);
      setSaved(true);
      await onCompleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la práctica.');
    } finally {
      setSaving(false);
    }
  };

  if (finished) {
    return (
      <CompletionPanel mod={mod} saving={saving} error={error} onRetry={save} />
    );
  }

  const spec = mod.practice;
  return (
    <div>
      <div className="max-w-2xl">
        <h2 className="text-[1.6rem]">{spec.title}</h2>
        <p className="mt-2 text-muted leading-relaxed">{spec.intro}</p>
        {alreadyDone && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-semibold">
            <CheckCircle2 className="size-4 text-accent-strong" aria-hidden="true" />
            Ya completaste esta práctica. Puedes repetirla para repasar.
          </p>
        )}
      </div>
      <div className="mt-6">
        <PracticeBody spec={spec} onDone={save} />
      </div>
    </div>
  );
}

function PracticeBody({ spec, onDone }: { spec: PracticeSpec; onDone: () => void }) {
  if (spec.kind === 'mission') return <MissionPractice spec={spec} onDone={onDone} />;
  if (spec.kind === 'diagnosis') return <DiagnosisPractice spec={spec} onDone={onDone} />;
  return <ProcedurePractice spec={spec} onDone={onDone} />;
}

/* =====================================================================
   Misión 3D: encontrar piezas en el modelo
   ===================================================================== */
function MissionPractice({ spec, onDone }: { spec: Extract<PracticeSpec, { kind: 'mission' }>; onDone: () => void }) {
  const components = DEVICE_COMPONENTS[spec.device];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState(0);
  const [assisted, setAssisted] = useState<string[]>([]);
  const [message, setMessage] = useState<{ kind: 'ok' | 'bad' | 'info'; text: string } | null>(null);
  const [exploded, setExploded] = useState(!!spec.startExploded);
  const [justFound, setJustFound] = useState(false);
  const done = index >= spec.targets.length;
  const target = spec.targets[Math.min(index, spec.targets.length - 1)];
  const canExplode = spec.device !== 'motherboard';

  const nameOf = (id: string) => components.find((c) => c.id === id)?.name ?? id;

  const onPick = (id: string | null) => {
    if (!id || done || justFound) return;
    setSelected(id);
    if (id === target.componentId) {
      setMessage({ kind: 'ok', text: `¡Sí! Eso es: ${nameOf(id)}.` });
      setJustFound(true);
    } else {
      setWrong((w) => w + 1);
      setMessage({ kind: 'bad', text: `Eso es: ${nameOf(id)}. ${target.hint}` });
    }
  };

  const nextTarget = () => {
    setJustFound(false);
    setWrong(0);
    setSelected(null);
    setMessage(null);
    setIndex((i) => i + 1);
  };

  const reveal = () => {
    setAssisted((a) => [...a, target.componentId]);
    setSelected(target.componentId);
    setMessage({ kind: 'info', text: `Aquí está: ${nameOf(target.componentId)}. Fíjate en su forma y posición.` });
    setJustFound(true);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="relative h-[min(34rem,75vw)] min-h-[20rem] overflow-hidden rounded-xl border border-line">
        <LazyStage
          modelType={spec.device}
          components={components}
          selectedId={selected}
          onSelectComponent={onPick}
          explodeAmount={exploded ? 1 : 0}
          showLabels={done}
          testId="mission-stage"
        />
        {canExplode && (
          <button
            type="button"
            aria-pressed={exploded}
            onClick={() => setExploded((e) => !e)}
            className={`absolute right-3 top-3 z-30 ${buttonClass('secondary', 'sm')} border border-line`}
          >
            {exploded ? 'Juntar las piezas' : 'Separar las piezas'}
          </button>
        )}
      </div>

      <aside className="rounded-xl border border-line bg-surface p-5" aria-live="polite">
        {done ? (
          <>
            <p className="font-serif text-xl font-semibold">Misión cumplida</p>
            <p className="mt-2 text-muted">
              Encontraste {spec.targets.length - assisted.length} de {spec.targets.length} piezas sin ayuda.
              Ahora se muestran todos los nombres para que repases.
            </p>
            <Button size="lg" className="mt-5 w-full" onClick={onDone}>
              Completar la práctica
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-muted tabular-nums">
              {spec.ordered ? 'Paso' : 'Pieza'} {index + 1} de {spec.targets.length}
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug">{target.prompt}</p>
            <p className="mt-2 text-sm text-muted">Gira el modelo arrastrando y haz clic sobre la pieza.</p>

            {message && (
              <p
                className={`mt-4 rounded-lg border p-3 text-[0.95rem] leading-snug ${
                  message.kind === 'ok'
                    ? 'border-success/50 bg-success-soft'
                    : message.kind === 'bad'
                      ? 'border-danger/40 bg-danger-soft'
                      : 'border-primary/40 bg-primary-soft'
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {justFound ? (
                <Button onClick={nextTarget}>
                  {index + 1 === spec.targets.length ? 'Terminar misión' : 'Siguiente'}
                </Button>
              ) : (
                wrong >= 2 && (
                  <Button variant="secondary" onClick={reveal}>
                    <Eye className="size-4" aria-hidden="true" /> Muéstrame dónde está
                  </Button>
                )
              )}
            </div>

            <ol className="mt-6 space-y-1.5 border-t border-line pt-4 text-sm">
              {spec.targets.map((t, i) => (
                <li key={t.componentId} className={`flex items-center gap-2 ${i > index ? 'text-muted' : ''}`}>
                  {i < index ? (
                    <Check className={`size-4 ${assisted.includes(t.componentId) ? 'text-muted' : 'text-accent-strong'}`} strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <span className={`size-2 rounded-full ${i === index ? 'bg-primary' : 'bg-line-strong'} mx-1`} aria-hidden="true" />
                  )}
                  {i < index ? nameOf(t.componentId) : i === index ? 'Buscando…' : 'Pendiente'}
                </li>
              ))}
            </ol>
          </>
        )}
      </aside>
    </div>
  );
}

/* =====================================================================
   Casos de diagnóstico
   ===================================================================== */
/** Orden estable pero no predecible: en los datos la opción correcta siempre va primero. */
function shuffledOptions<T>(items: T[], seedText: string): T[] {
  let s = 0;
  for (const ch of seedText) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function DiagnosisPractice({ spec, onDone }: { spec: Extract<PracticeSpec, { kind: 'diagnosis' }>; onDone: () => void }) {
  const cases = spec.caseIds
    .map((id) => faultCases.find((c) => c.id === id))
    .filter((c) => !!c)
    .map((c) => ({ ...c, options: shuffledOptions(c.options, c.id) }));
  const [index, setIndex] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fc = cases[index];
  const last = index === cases.length - 1;

  const pick = (optId: string) => {
    if (solved || tried.includes(optId)) return;
    setTried((t) => [...t, optId]);
    if (fc.options.find((o) => o.id === optId)?.isCorrect) setSolved(true);
  };

  const next = () => {
    if (last) return onDone();
    setIndex((i) => i + 1);
    setTried([]);
    setSolved(false);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-muted tabular-nums">
        Caso {index + 1} de {cases.length}
      </p>
      <div className="mt-3 rounded-xl border border-line bg-surface p-5">
        <p className="text-sm font-bold text-primary">{fc.device}</p>
        <h3 ref={headingRef} tabIndex={-1} className="mt-1 text-[1.35rem] leading-snug outline-none">
          {fc.symptom}
        </h3>
        <p className="mt-3 text-muted leading-relaxed">{fc.context}</p>
      </div>

      <p className="mt-6 font-semibold">¿Cuál es la causa más probable?</p>
      <div className="mt-3 space-y-2.5" role="list">
        {fc.options.map((opt) => {
          const wasTried = tried.includes(opt.id);
          const cls = wasTried
            ? opt.isCorrect
              ? 'border-success bg-success-soft'
              : 'border-danger bg-danger-soft'
            : solved
              ? 'border-line opacity-60'
              : 'border-line-strong bg-surface hover:border-primary';
          return (
            <div key={opt.id} role="listitem">
              <button
                type="button"
                onClick={() => pick(opt.id)}
                disabled={solved || wasTried}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors disabled:cursor-default ${cls}`}
              >
                {wasTried ? (
                  opt.isCorrect ? (
                    <Check className="size-5 shrink-0 text-success mt-0.5" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <X className="size-5 shrink-0 text-danger mt-0.5" strokeWidth={3} aria-hidden="true" />
                  )
                ) : (
                  <span className="size-5 shrink-0 rounded-full border-2 border-line-strong mt-0.5" aria-hidden="true" />
                )}
                <span className="leading-snug">{opt.label}</span>
              </button>
              {wasTried && (
                <p role="status" className="mt-1.5 ml-3 pl-5 text-[0.95rem] leading-relaxed text-ink border-l-2 border-line-strong">
                  {opt.feedback}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {solved && (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <p className="flex items-center gap-2 font-bold">
            <Wrench className="size-4 text-primary" aria-hidden="true" /> Cómo se resuelve
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-relaxed">
            {fc.solutionSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <Button size="lg" className="mt-5" onClick={next}>
            {last ? 'Terminar los casos' : 'Siguiente caso'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Procedimiento guiado (taller)
   ===================================================================== */
function ProcedurePractice({ spec, onDone }: { spec: Extract<PracticeSpec, { kind: 'procedure' }>; onDone: () => void }) {
  const tut = maintenanceTutorials.find((t) => t.id === spec.tutorialId);
  const [checks, setChecks] = useState<boolean[]>(() => tut?.safetyWarnings.map(() => false) ?? []);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const current = tut?.steps[step];
  useEffect(() => {
    if (!started || !current) return;
    setReady(false);
    const t = window.setTimeout(() => setReady(true), readingSeconds(`${current.title} ${current.detail}`) * 1000);
    return () => window.clearTimeout(t);
  }, [started, step, current]);

  if (!tut) return <ErrorNotice>No se encontró el procedimiento.</ErrorNotice>;
  const allChecked = checks.every(Boolean);

  if (!started) {
    return (
      <div className="grid max-w-4xl gap-6 md:grid-cols-[1fr_16rem]">
        <div className="rounded-xl border border-danger/35 bg-surface p-5">
          <p className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-5 text-danger" aria-hidden="true" /> Antes de empezar, confirma la seguridad
          </p>
          <p className="mt-1 text-sm text-muted">Marca cada punto. En el taller real, esto lo revisa tu docente.</p>
          <ul className="mt-4 space-y-2.5">
            {tut.safetyWarnings.map((w, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-secondary/60">
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={(e) => setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
                    className="mt-1 size-5 shrink-0 accent-[var(--c-primary)]"
                  />
                  <span className="leading-snug">{w}</span>
                </label>
              </li>
            ))}
          </ul>
          <Button size="lg" className="mt-5" disabled={!allChecked} onClick={() => setStarted(true)}>
            Empezar el procedimiento
          </Button>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="font-bold">Herramientas</p>
          <ul className="mt-2 space-y-1 text-[0.95rem] text-muted">
            {tut.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">Duración aproximada: {tut.duration}</p>
        </div>
      </div>
    );
  }

  const last = step === tut.steps.length - 1;
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-muted tabular-nums">
        Paso {step + 1} de {tut.steps.length}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {tut.steps.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-accent' : i === step ? 'bg-primary' : 'bg-secondary'}`} />
        ))}
      </div>
      <h3 ref={headingRef} tabIndex={-1} className="mt-6 text-[1.6rem] outline-none">
        {current!.title}
      </h3>
      <p className="reading mt-3">{current!.detail}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Paso anterior
          </Button>
        )}
        <Button
          size="lg"
          disabled={!ready}
          onClick={() => {
            if (last) onDone();
            else {
              setStep((s) => s + 1);
              requestAnimationFrame(() => headingRef.current?.focus());
            }
          }}
        >
          {last ? 'Terminé el procedimiento' : 'Entendido, siguiente paso'}
        </Button>
      </div>
      {!ready && <p className="mt-3 text-sm text-muted">El botón se habilita en unos segundos para que alcances a leer.</p>}
    </div>
  );
}

/* =====================================================================
   Cierre del módulo
   ===================================================================== */
function CompletionPanel({
  mod,
  saving,
  error,
  onRetry,
}: {
  mod: CourseModule;
  saving: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const next = courseModules.find((m) => m.number === mod.number + 1);
  return (
    <div className="max-w-2xl" aria-live="polite">
      {error ? (
        <ErrorNotice action={<Button variant="secondary" size="sm" onClick={onRetry}>Reintentar</Button>}>
          {error}
        </ErrorNotice>
      ) : (
        <>
          <PartyPopper className="size-9 text-accent-strong" aria-hidden="true" />
          <h2 className="mt-4 text-[2rem]">
            {saving ? 'Guardando tu avance…' : `Completaste el módulo ${mod.number}`}
          </h2>
          <p className="mt-3 text-muted leading-relaxed">
            {next
              ? `Se desbloqueó el módulo ${next.number}: ${next.title}. Puedes seguir ahora o volver más tarde; tu avance queda guardado.`
              : 'Terminaste todos los módulos. Ya puedes rendir el examen final cuando te sientas preparado.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {next ? (
              <a href={`#/modulo/${next.id}/teoria`} className={buttonClass('primary', 'lg')} aria-disabled={saving}>
                Empezar el módulo {next.number}
              </a>
            ) : (
              <a href="#/examen" className={buttonClass('primary', 'lg')}>
                Ir al examen final
              </a>
            )}
            <a href="#/ruta" className={buttonClass('secondary', 'lg')}>
              Ver mi ruta
            </a>
          </div>
        </>
      )}
    </div>
  );
}
