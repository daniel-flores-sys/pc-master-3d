import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { courseModules } from '../content/modules';
import { desktopComponents } from '../data/desktopComponents';
import LazyStage from '../three/LazyStage';
import { buttonClass } from '../ui/Button';
import { Wordmark } from '../ui/Wordmark';

const METHOD = [
  {
    title: 'Lee',
    text: 'Una idea por pantalla, en frases cortas. Las palabras técnicas tienen su definición a un toque.',
  },
  {
    title: 'Responde',
    text: 'Preguntas breves al final de cada tema. Si te equivocas, ves por qué y lo vuelves a intentar.',
  },
  {
    title: 'Practica',
    text: 'Buscas piezas en el modelo 3D, resuelves casos de fallas reales y sigues procedimientos de taller.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedComp = desktopComponents.find((c) => c.id === selected);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:pt-16">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2.4rem,5.4vw,3.9rem)] leading-[1.05]">
            Aprende a cuidar una computadora por dentro.
          </h1>
          <p className="mt-6 text-lg text-muted leading-relaxed max-w-[34rem]">
            Un curso guiado para estudiantes: lees una idea corta, la ves en 3D y la practicas.
            Tu avance queda guardado y, al final, rindes un examen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <a href="#/ruta" className={buttonClass('primary', 'lg')}>
                Continuar mi ruta
              </a>
            ) : (
              <>
                <a href="#/registro" className={buttonClass('primary', 'lg')}>
                  Crear mi cuenta
                </a>
                <a href="#/entrar" className={buttonClass('secondary', 'lg')}>
                  Ya tengo cuenta
                </a>
              </>
            )}
          </div>
          <p className="mt-5 text-sm text-muted">
            Son siete módulos y te tomará unas dos horas en total.
          </p>
        </div>

        <figure className="relative">
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-line bg-stage">
            <LazyStage
              modelType="desktop"
              components={desktopComponents}
              selectedId={selected}
              onSelectComponent={(id) => setSelected(id)}
              explodeAmount={open ? 1 : 0}
              showLabels={false}
              testId="landing-stage"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
              <p
                aria-live="polite"
                className="pointer-events-auto max-w-[70%] rounded-xl bg-surface/95 px-3.5 py-2.5 text-sm text-ink border border-line"
              >
                {selectedComp ? (
                  <>
                    <span className="font-bold">{selectedComp.name}.</span>{' '}
                    <span className="text-muted">{selectedComp.purpose}</span>
                  </>
                ) : open ? (
                  'Toca una pieza para saber qué hace.'
                ) : (
                  'Gira el modelo arrastrando. Luego ábrelo.'
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen((o) => !o);
                  setSelected(null);
                }}
                aria-pressed={open}
                className={`pointer-events-auto ${buttonClass('primary', 'md')}`}
              >
                {open ? 'Cerrar el gabinete' : 'Abrir el gabinete'}
              </button>
            </div>
          </div>
          <figcaption className="sr-only">
            Modelo 3D interactivo de una computadora de escritorio.
          </figcaption>
        </figure>
      </section>

      {/* ---------- Método ---------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[1.9rem]">Cómo se aprende aquí</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Cada módulo sigue el mismo orden. No se avanza al siguiente paso hasta terminar el anterior,
            así que nada aparece de golpe.
          </p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {METHOD.map((step, i) => (
              <li key={step.title} className="relative md:pr-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary font-bold text-primary tabular-nums">
                    {i + 1}
                  </span>
                  <span className="hidden md:block h-0 flex-1 border-t-2 border-dashed border-line-strong" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl">{step.title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Ruta ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-[1.9rem]">La ruta completa</h2>
            <p className="mt-3 text-muted max-w-md">
              Siete módulos en orden, de lo general a lo práctico. Al completarlos se habilita el examen final,
              que se rinde en pantalla completa desde una computadora.
            </p>
          </div>
          <ol className="relative">
            <span
              aria-hidden="true"
              className="absolute left-[1.05rem] top-3 bottom-3 border-l-2 border-dashed border-line-strong"
            />
            {courseModules.map((m) => (
              <li key={m.id} className="relative flex gap-4 pb-6">
                <span className="relative z-10 flex size-[2.1rem] shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-secondary text-sm font-bold tabular-nums">
                  {m.number}
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-ink">{m.title}</p>
                  <p className="text-sm text-muted">{m.outcome}</p>
                </div>
              </li>
            ))}
            <li className="relative flex gap-4">
              <span className="relative z-10 flex size-[2.1rem] shrink-0 items-center justify-center rounded-lg border-2 border-primary bg-primary text-on-primary text-sm font-bold">
                ✓
              </span>
              <div className="pt-0.5">
                <p className="font-semibold text-ink">Examen final</p>
                <p className="text-sm text-muted">20 preguntas, 30 minutos, 2 intentos.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
          <Wordmark />
          <p>Material educativo. Practica con equipos reales solo con la supervisión de tu docente.</p>
        </div>
      </footer>
    </div>
  );
}
