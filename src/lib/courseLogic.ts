/**
 * Reglas de avance del curso (espejo de lo que valida el servidor).
 * Funciones puras para poder probarlas sin navegador.
 */

export type StepKey = 'theory' | 'quiz' | 'practice';
export type NodeStatus = 'done' | 'current' | 'locked';

export const STEP_ORDER: StepKey[] = ['theory', 'quiz', 'practice'];

export const STEP_SLUG: Record<StepKey, 'teoria' | 'preguntas' | 'practica'> = {
  theory: 'teoria',
  quiz: 'preguntas',
  practice: 'practica',
};

export const STEP_LABEL: Record<StepKey, string> = {
  theory: 'Teoría',
  quiz: 'Preguntas',
  practice: 'Práctica',
};

export interface ProgressLike {
  module_id: string;
  theory_done_at: string | null;
  quiz_passed_at: string | null;
  practice_done_at: string | null;
  quiz_best_score?: number | null;
  quiz_total?: number | null;
}

export interface ModuleState {
  id: string;
  status: NodeStatus;
  steps: Record<StepKey, NodeStatus>;
  /** Paso por el que continuar, o null si el módulo está completo o bloqueado */
  nextStep: StepKey | null;
  quizBest: number | null;
  quizTotal: number | null;
}

export interface CourseState {
  modules: ModuleState[];
  doneCount: number;
  total: number;
  currentModuleId: string | null;
  examUnlocked: boolean;
}

function stepDone(row: ProgressLike | undefined, step: StepKey): boolean {
  if (!row) return false;
  if (step === 'theory') return !!row.theory_done_at;
  if (step === 'quiz') return !!row.quiz_passed_at;
  return !!row.practice_done_at;
}

export function computeCourseState(
  moduleIds: string[],
  progress: ProgressLike[],
): CourseState {
  const byId = new Map(progress.map((p) => [p.module_id, p]));
  let previousDone = true; // el primer módulo siempre está disponible
  let currentModuleId: string | null = null;

  const modules: ModuleState[] = moduleIds.map((id) => {
    const row = byId.get(id);
    const done = stepDone(row, 'practice');
    const unlocked = previousDone;
    previousDone = done;

    if (done) {
      return {
        id,
        status: 'done',
        steps: { theory: 'done', quiz: 'done', practice: 'done' },
        nextStep: null,
        quizBest: row?.quiz_best_score ?? null,
        quizTotal: row?.quiz_total ?? null,
      };
    }

    if (!unlocked) {
      return {
        id,
        status: 'locked',
        steps: { theory: 'locked', quiz: 'locked', practice: 'locked' },
        nextStep: null,
        quizBest: null,
        quizTotal: null,
      };
    }

    if (currentModuleId === null) currentModuleId = id;

    const steps = {} as Record<StepKey, NodeStatus>;
    let nextStep: StepKey | null = null;
    for (const step of STEP_ORDER) {
      if (stepDone(row, step)) {
        steps[step] = 'done';
      } else if (nextStep === null) {
        steps[step] = 'current';
        nextStep = step;
      } else {
        steps[step] = 'locked';
      }
    }

    return {
      id,
      status: 'current',
      steps,
      nextStep,
      quizBest: row?.quiz_best_score ?? null,
      quizTotal: row?.quiz_total ?? null,
    };
  });

  const doneCount = modules.filter((m) => m.status === 'done').length;
  return {
    modules,
    doneCount,
    total: moduleIds.length,
    currentModuleId,
    examUnlocked: doneCount === moduleIds.length && moduleIds.length > 0,
  };
}

/** ¿Se puede abrir este paso? (los completados se pueden repasar) */
export function canOpenStep(state: CourseState, moduleId: string, step: StepKey): boolean {
  const mod = state.modules.find((m) => m.id === moduleId);
  return !!mod && mod.steps[step] !== 'locked';
}

/** Segundos sugeridos de lectura antes de poder avanzar (≈ 4 palabras/seg, entre 4 y 14 s). */
export function readingSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(14, Math.max(4, Math.round(words / 4)));
}

/** Tiempo restante en ms corrigiendo el desfase del reloj local con el del servidor. */
export function remainingMs(deadlineIso: string, serverNowIso: string, receivedAtLocal: number, nowLocal: number): number {
  const skew = new Date(serverNowIso).getTime() - receivedAtLocal;
  const serverNow = nowLocal + skew;
  return Math.max(0, new Date(deadlineIso).getTime() - serverNow);
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
