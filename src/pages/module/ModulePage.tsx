import { ArrowLeft, Check, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { getModule } from '../../content/modules';
import { canOpenStep, STEP_LABEL, STEP_ORDER, STEP_SLUG, type StepKey } from '../../lib/courseLogic';
import { useProgress } from '../../lib/ProgressProvider';
import { navigate, type ModuleStepSlug } from '../../router/useHashRoute';
import { buttonClass } from '../../ui/Button';
import { Spinner } from '../../ui/Feedback';
import PracticeStep from './PracticeStep';
import QuizStep from './QuizStep';
import TheoryStep from './TheoryStep';

const SLUG_TO_STEP: Record<ModuleStepSlug, StepKey> = {
  teoria: 'theory',
  preguntas: 'quiz',
  practica: 'practice',
};

export default function ModulePage({ moduleId, step }: { moduleId: string; step: ModuleStepSlug | null }) {
  const mod = getModule(moduleId);
  const { course, rows, loading, refresh } = useProgress();
  const state = course.modules.find((m) => m.id === moduleId);
  const requested = step ? SLUG_TO_STEP[step] : null;

  // Paso a mostrar: el pedido si está permitido; si no, el siguiente pendiente.
  const fallback: StepKey = state?.nextStep ?? 'theory';
  const active: StepKey = requested && canOpenStep(course, moduleId, requested) ? requested : fallback;

  useEffect(() => {
    if (!mod || !state || state.status === 'locked' || loading) return;
    if (requested !== active) {
      navigate({ name: 'module', moduleId, step: STEP_SLUG[active] }, { replace: true });
    }
  }, [mod, state, requested, active, moduleId, loading]);

  if (!mod) {
    return (
      <Centered>
        <h1 className="text-2xl">No encontramos ese módulo</h1>
        <a href="#/ruta" className={`${buttonClass('primary')} mt-6`}>Volver a mi ruta</a>
      </Centered>
    );
  }

  if (loading && rows.length === 0) return <Spinner label="Cargando el módulo…" />;

  if (!state || state.status === 'locked') {
    return (
      <Centered>
        <Lock className="mx-auto size-8 text-muted" aria-hidden="true" />
        <h1 className="mt-4 text-2xl">Este módulo todavía está bloqueado</h1>
        <p className="mt-3 text-muted">Completa el módulo anterior para abrirlo.</p>
        <a href="#/ruta" className={`${buttonClass('primary')} mt-6`}>Volver a mi ruta</a>
      </Centered>
    );
  }

  const afterStep = async (next: StepKey | 'roadmap') => {
    await refresh();
    if (next === 'roadmap') navigate({ name: 'roadmap' });
    else navigate({ name: 'module', moduleId, step: STEP_SLUG[next] });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <a href="#/ruta" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> Mi ruta
      </a>

      <header className="mt-4 flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">Módulo {mod.number} de 7</p>
          <h1 className="mt-1 text-[clamp(1.8rem,3.4vw,2.4rem)]">{mod.title}</h1>
          <p className="mt-2 text-muted">{mod.outcome}</p>
        </div>

        <nav aria-label="Pasos del módulo">
          <ol className="flex items-center gap-1.5">
            {STEP_ORDER.map((s, i) => {
              const status = state.steps[s];
              const isActive = s === active;
              const content = (
                <>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                      status === 'done'
                        ? 'bg-accent text-on-accent'
                        : isActive
                          ? 'bg-primary text-on-primary'
                          : 'border-[1.5px] border-line-strong text-muted'
                    }`}
                  >
                    {status === 'done' ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                  </span>
                  <span>{STEP_LABEL[s]}</span>
                </>
              );
              const cls = `inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold ${
                isActive ? 'bg-secondary text-ink' : status === 'locked' ? 'text-muted/70' : 'text-muted hover:text-ink hover:bg-secondary/70'
              }`;
              return (
                <li key={s} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true" className="h-0 w-4 border-t-2 border-dashed border-line-strong" />}
                  {status === 'locked' ? (
                    <span className={cls} aria-disabled="true">
                      {content}
                    </span>
                  ) : (
                    <a
                      href={`#/modulo/${mod.id}/${STEP_SLUG[s]}`}
                      className={cls}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {content}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="pt-8">
        {active === 'theory' && (
          <TheoryStep
            key={`${mod.id}-theory`}
            mod={mod}
            alreadyDone={state.steps.theory === 'done'}
            onFinished={() => afterStep('quiz')}
          />
        )}
        {active === 'quiz' && (
          <QuizStep
            key={`${mod.id}-quiz`}
            mod={mod}
            alreadyPassed={state.steps.quiz === 'done'}
            onPassed={() => afterStep('practice')}
            onProgressChanged={refresh}
          />
        )}
        {active === 'practice' && (
          <PracticeStep
            key={`${mod.id}-practice`}
            mod={mod}
            alreadyDone={state.steps.practice === 'done'}
            onCompleted={refresh}
          />
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-4 py-20 text-center">{children}</div>;
}
