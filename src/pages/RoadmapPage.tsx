import { BookOpen, Check, FlaskConical, Lock, MessageCircleQuestion, Trophy, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { courseModules, type CourseModule } from '../content/modules';
import { fetchExamStatus, type ExamStatus } from '../lib/api';
import { STEP_LABEL, STEP_ORDER, STEP_SLUG, type ModuleState, type NodeStatus, type StepKey } from '../lib/courseLogic';
import { useProgress } from '../lib/ProgressProvider';
import { buttonClass } from '../ui/Button';
import { ErrorNotice, ProgressBar, Spinner } from '../ui/Feedback';

const STEP_ICON: Record<StepKey, typeof BookOpen> = {
  theory: BookOpen,
  quiz: MessageCircleQuestion,
  practice: FlaskConical,
};

/* Geometría de las ramas: 3 nodos de 44 px con 8 px de separación */
const STEP_H = 44;
const STEP_GAP = 8;
const CLUSTER_H = STEP_H * 3 + STEP_GAP * 2;
const STEP_Y = [0, 1, 2].map((i) => i * (STEP_H + STEP_GAP) + STEP_H / 2);

function moduleHref(id: string, step?: StepKey) {
  return `#/modulo/${id}${step ? `/${STEP_SLUG[step]}` : ''}`;
}

export default function RoadmapPage() {
  const { user } = useAuth();
  const { course, loading, error, refresh } = useProgress();
  const [exam, setExam] = useState<ExamStatus | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!course.examUnlocked) return;
    fetchExamStatus().then(setExam).catch(() => setExam(null));
  }, [course.examUnlocked]);

  const current = course.modules.find((m) => m.id === course.currentModuleId);
  const currentModule = courseModules.find((m) => m.id === course.currentModuleId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ---------- Encabezado ---------- */}
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div>
          <h1 className="text-[clamp(2rem,4vw,2.7rem)]">Hola, {user?.name}</h1>
          <p className="mt-3 max-w-xl text-muted">
            Esta es tu ruta. Avanza en orden: cada módulo tiene teoría, preguntas y una práctica.
            Lo que completes queda guardado.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="font-semibold">
            {course.doneCount === course.total
              ? 'Completaste todos los módulos'
              : `Completaste ${course.doneCount} de ${course.total} módulos`}
          </p>
          <div className="mt-3">
            <ProgressBar value={course.doneCount} max={course.total} label="Módulos completados" />
          </div>
          {current && currentModule && current.nextStep && (
            <a href={moduleHref(current.id, current.nextStep)} className={`${buttonClass('primary', 'md')} mt-4 w-full`}>
              Continuar: {STEP_LABEL[current.nextStep].toLowerCase()} del módulo {currentModule.number}
            </a>
          )}
          {course.examUnlocked && (
            <a href="#/examen" className={`${buttonClass('primary', 'md')} mt-4 w-full`}>
              Ir al examen final
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorNotice action={<button className="font-semibold underline" onClick={() => void refresh()}>Reintentar</button>}>
            {error}
          </ErrorNotice>
        </div>
      )}

      <Legend />

      {loading && course.modules.every((m) => m.status !== 'done') && !error ? (
        <Spinner label="Cargando tu progreso…" />
      ) : (
        <>
          <DesktopRoadmap modules={course.modules} examUnlocked={course.examUnlocked} exam={exam} />
          <MobileRoadmap modules={course.modules} examUnlocked={course.examUnlocked} exam={exam} />
        </>
      )}

      {/* ---------- Modo libre ---------- */}
      <section className="mt-16 border-t border-line pt-8">
        <h2 className="text-xl">Explorar por tu cuenta</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Fuera de la ruta puedes revisar los modelos 3D y las fichas del taller cuando quieras. No cuentan para tu avance.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="#/laboratorio/escritorio" className={buttonClass('secondary', 'md')}>
            <FlaskConical className="size-4" aria-hidden="true" /> Laboratorio 3D
          </a>
          <a href="#/taller" className={buttonClass('secondary', 'md')}>
            <Wrench className="size-4" aria-hidden="true" /> Taller de mantenimiento
          </a>
        </div>
      </section>
    </div>
  );
}

/* ===================================================================== */

function Legend() {
  return (
    <ul className="mt-10 mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" aria-label="Leyenda">
      <li className="flex items-center gap-2">
        <span className="inline-flex size-5 items-center justify-center rounded border-2 border-accent-strong bg-accent-soft">
          <Check className="size-3 text-accent-strong" strokeWidth={3} aria-hidden="true" />
        </span>
        Completado
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block size-5 rounded border-2 border-ink bg-primary" /> En curso
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-block size-5 rounded border-2 border-dashed border-line-strong bg-surface" /> Bloqueado
      </li>
    </ul>
  );
}

function statusText(s: NodeStatus) {
  return s === 'done' ? 'completado' : s === 'current' ? 'en curso' : 'bloqueado';
}

function MainNode({ mod, state, full = false }: { mod: CourseModule; state: ModuleState; full?: boolean }) {
  const s = state.status;
  const cls =
    s === 'done'
      ? 'border-accent-strong bg-accent-soft text-ink hover:bg-[color-mix(in_oklab,var(--c-accent)_24%,var(--c-surface))]'
      : s === 'current'
        ? 'border-ink bg-primary text-on-primary shadow-[0_3px_0_0_var(--c-ink)]'
        : 'border-dashed border-line-strong bg-surface text-muted';
  const content = (
    <>
      <span className={`text-xs font-bold ${s === 'current' ? 'opacity-85' : 'text-muted'}`}>
        Módulo {mod.number}
      </span>
      <span className="mt-0.5 flex items-start gap-2">
        <span className="font-serif text-[1.08rem] font-semibold leading-snug">{mod.title}</span>
        {s === 'done' && <Check className="ml-auto mt-0.5 size-5 shrink-0 text-accent-strong" strokeWidth={3} aria-hidden="true" />}
        {s === 'locked' && <Lock className="ml-auto mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      </span>
    </>
  );
  const base = `relative z-10 flex flex-col rounded-lg border-2 px-4 py-3 text-left transition-colors ${
    full ? 'w-full' : 'w-[17.5rem]'
  } ${cls}`;

  if (s === 'locked') {
    return (
      <div className={base} aria-label={`Módulo ${mod.number}: ${mod.title}, ${statusText(s)}`}>
        {content}
      </div>
    );
  }
  return (
    <a
      href={moduleHref(mod.id, state.nextStep ?? undefined)}
      className={base}
      aria-label={`Módulo ${mod.number}: ${mod.title}, ${statusText(s)}`}
    >
      {content}
    </a>
  );
}

function StepNode({ moduleId, step, status, extra }: { moduleId: string; step: StepKey; status: NodeStatus; extra?: string }) {
  const Icon = STEP_ICON[step];
  const cls =
    status === 'done'
      ? 'border-accent-strong/70 bg-surface text-ink hover:border-accent-strong'
      : status === 'current'
        ? 'border-primary bg-primary-soft text-ink font-bold'
        : 'border-dashed border-line-strong bg-canvas text-muted';
  const inner = (
    <>
      <Icon className={`size-4 shrink-0 ${status === 'current' ? 'text-primary' : ''}`} aria-hidden="true" />
      <span className="truncate">{STEP_LABEL[step]}</span>
      {extra && <span className="ml-1 text-xs text-muted tabular-nums">{extra}</span>}
      {status === 'done' && <Check className="ml-auto size-4 shrink-0 text-accent-strong" strokeWidth={3} aria-hidden="true" />}
      {status === 'locked' && <Lock className="ml-auto size-3.5 shrink-0" aria-hidden="true" />}
    </>
  );
  const base = `relative z-10 flex items-center gap-2 rounded-md border-[1.5px] px-3 text-sm transition-colors`;
  const style = { height: STEP_H };
  const label = `${STEP_LABEL[step]}, ${statusText(status)}`;
  return status === 'locked' ? (
    <div className={`${base} ${cls}`} style={style} aria-label={label}>
      {inner}
    </div>
  ) : (
    <a href={moduleHref(moduleId, step)} className={`${base} ${cls}`} style={style} aria-label={label}>
      {inner}
    </a>
  );
}

function quizExtra(state: ModuleState) {
  return state.quizBest != null && state.quizTotal ? `${state.quizBest}/${state.quizTotal}` : undefined;
}

function Branch({ side, active }: { side: 'left' | 'right'; active: boolean }) {
  const mid = CLUSTER_H / 2;
  return (
    <svg
      width="56"
      height={CLUSTER_H}
      viewBox={`0 0 56 ${CLUSTER_H}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      {STEP_Y.map((y) => {
        const d =
          side === 'right'
            ? `M0 ${mid} C 28 ${mid}, 28 ${y}, 56 ${y}`
            : `M56 ${mid} C 28 ${mid}, 28 ${y}, 0 ${y}`;
        return (
          <path
            key={y}
            d={d}
            fill="none"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
            style={{ stroke: active ? 'var(--c-primary)' : 'var(--c-line-strong)' }}
          />
        );
      })}
    </svg>
  );
}

function DesktopRoadmap({ modules, examUnlocked, exam }: { modules: ModuleState[]; examUnlocked: boolean; exam: ExamStatus | null }) {
  return (
    <div className="relative hidden md:block">
      {/* Columna vertebral */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-6 bottom-10 -translate-x-1/2 border-l-[3px] border-dashed border-line-strong"
      />
      <ol className="relative space-y-10">
        {modules.map((state, i) => {
          const mod = courseModules[i];
          const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left';
          const cluster = (
            <div className="flex flex-col" style={{ gap: STEP_GAP, width: '11.5rem' }}>
              {STEP_ORDER.map((step) => (
                <StepNode
                  key={step}
                  moduleId={mod.id}
                  step={step}
                  status={state.steps[step]}
                  extra={step === 'quiz' ? quizExtra(state) : undefined}
                />
              ))}
            </div>
          );
          return (
            <li key={mod.id} className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="flex items-center justify-end">
                {side === 'left' && (
                  <>
                    {cluster}
                    <Branch side="left" active={state.status === 'current'} />
                  </>
                )}
              </div>
              <MainNode mod={mod} state={state} />
              <div className="flex items-center justify-start">
                {side === 'right' && (
                  <>
                    <Branch side="right" active={state.status === 'current'} />
                    {cluster}
                  </>
                )}
              </div>
            </li>
          );
        })}
        <li className="grid grid-cols-[1fr_auto_1fr] items-center pt-4">
          <span />
          <ExamNode examUnlocked={examUnlocked} exam={exam} />
          <span />
        </li>
      </ol>
    </div>
  );
}

function ExamNode({ examUnlocked, exam, full = false }: { examUnlocked: boolean; exam: ExamStatus | null; full?: boolean }) {
  const passed = exam?.passed;
  const detail = passed
    ? `Aprobado con ${exam?.best_score}/${exam?.best_total}`
    : examUnlocked
      ? exam
        ? `${Math.max(0, exam.max_attempts - exam.attempts_used)} de ${exam.max_attempts} intentos disponibles`
        : 'Listo para rendir'
      : 'Se habilita al completar los 7 módulos';
  const cls = passed
    ? 'border-accent-strong bg-accent-soft text-ink'
    : examUnlocked
      ? 'border-ink bg-primary text-on-primary shadow-[0_3px_0_0_var(--c-ink)]'
      : 'border-dashed border-line-strong bg-surface text-muted';
  const body = (
    <>
      <Trophy className="size-6 shrink-0" aria-hidden="true" />
      <span>
        <span className="block font-serif text-[1.15rem] font-semibold">Examen final</span>
        <span className={`block text-sm ${examUnlocked && !passed ? 'opacity-90' : 'text-muted'}`}>{detail}</span>
      </span>
    </>
  );
  const base = `relative z-10 flex items-center gap-3 rounded-xl border-2 px-5 py-4 ${full ? 'w-full' : 'w-[19rem]'} ${cls}`;
  return examUnlocked ? (
    <a href="#/examen" className={base}>
      {body}
    </a>
  ) : (
    <div className={base}>{body}</div>
  );
}

function MobileRoadmap({ modules, examUnlocked, exam }: { modules: ModuleState[]; examUnlocked: boolean; exam: ExamStatus | null }) {
  return (
    <ol className="relative space-y-6 md:hidden">
      <span aria-hidden="true" className="absolute left-5 top-4 bottom-8 border-l-[3px] border-dashed border-line-strong" />
      {modules.map((state, i) => {
        const mod = courseModules[i];
        return (
          <li key={mod.id} className="relative">
            <MainNode mod={mod} state={state} full />
            <ul className="mt-2 ml-10 space-y-2 border-l-2 border-dashed border-line-strong pl-4">
              {STEP_ORDER.map((step) => (
                <li key={step}>
                  <StepNode
                    moduleId={mod.id}
                    step={step}
                    status={state.steps[step]}
                    extra={step === 'quiz' ? quizExtra(state) : undefined}
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
      <li className="relative pt-2">
        <ExamNode examUnlocked={examUnlocked} exam={exam} full />
      </li>
    </ol>
  );
}
