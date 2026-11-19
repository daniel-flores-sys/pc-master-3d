import { insforge } from './insforge';

// ---------------------------------------------------------------------
// Tipos que devuelve el servidor
// ---------------------------------------------------------------------
export interface ModuleProgressRow {
  module_id: string;
  theory_done_at: string | null;
  quiz_best_score: number | null;
  quiz_total: number | null;
  quiz_passed_at: string | null;
  practice_done_at: string | null;
}

export interface QuizQuestion {
  id: string;
  module_id: string;
  position: number;
  topic: string;
  prompt: string;
  options: string[];
}

export interface QuizAnswerResult {
  question_id: string;
  selected: number;
  is_correct: boolean;
  correct_index: number;
  explanation: string;
  answered: number;
  total: number;
  finished: boolean;
  score: number | null;
  passed: boolean | null;
}

export interface OpenQuizAnswer {
  question_id: string;
  selected: number;
  is_correct: boolean;
  correct_index: number;
  explanation: string;
}

export interface ExamStatus {
  eligible: boolean;
  modules_done: number;
  modules_total: number;
  attempts_used: number;
  max_attempts: number;
  passed: boolean;
  best_score: number | null;
  best_total: number | null;
  active_attempt: string | null;
  question_count: number;
  minutes: number;
  pass_pct: number;
  max_violations: number;
}

export interface ExamQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
}

export interface ExamPayload {
  attempt_id: string;
  deadline: string;
  server_now: string;
  violations: number;
  max_violations: number;
  answers: Record<string, number>;
  questions: ExamQuestion[];
}

export interface ExamReviewItem extends ExamQuestion {
  selected: number | null;
  correct_index: number;
  explanation: string;
}

export interface ExamResult {
  score: number;
  total: number;
  passed: boolean;
  status: 'submitted' | 'expired';
  pass_pct: number;
  attempts_left: number;
  topics_to_review: string[];
  review: ExamReviewItem[] | null;
}

export type ExamEventType =
  | 'fullscreen_exit'
  | 'tab_hidden'
  | 'window_blur'
  | 'copy_attempt'
  | 'context_menu'
  | 'resumed';

// ---------------------------------------------------------------------
// Errores en lenguaje claro
// ---------------------------------------------------------------------
export class ApiError extends Error {}

function toApiError(error: unknown): ApiError {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  const raw: string = message || 'Algo salió mal. Revisa tu conexión e inténtalo otra vez.';
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return new ApiError('No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.');
  }
  if (/jwt|token|not authenticated|28000/i.test(raw)) {
    return new ApiError('Tu sesión terminó. Vuelve a iniciar sesión.');
  }
  return new ApiError(raw);
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await insforge.database.rpc(fn, args ?? {});
  if (error) throw toApiError(error);
  return data as T;
}

// ---------------------------------------------------------------------
// Progreso y módulos
// ---------------------------------------------------------------------
export async function fetchProgress(): Promise<ModuleProgressRow[]> {
  const { data, error } = await insforge.database
    .from('module_progress')
    .select('module_id, theory_done_at, quiz_best_score, quiz_total, quiz_passed_at, practice_done_at')
    .limit(50);
  if (error) throw toApiError(error);
  return (data ?? []) as ModuleProgressRow[];
}

export function completeTheory(moduleId: string) {
  return rpc<void>('complete_theory', { p_module: moduleId });
}

export async function fetchQuizQuestions(moduleId: string): Promise<QuizQuestion[]> {
  const { data, error } = await insforge.database
    .from('questions')
    .select('id, module_id, position, topic, prompt, options')
    .eq('module_id', moduleId)
    .order('position', { ascending: true })
    .limit(30);
  if (error) throw toApiError(error);
  return (data ?? []) as QuizQuestion[];
}

export function answerQuizQuestion(questionId: string, selected: number) {
  return rpc<QuizAnswerResult>('answer_quiz_question', {
    p_question: questionId,
    p_selected: selected,
  });
}

export function getOpenQuiz(moduleId: string) {
  return rpc<OpenQuizAnswer[]>('get_open_quiz', { p_module: moduleId });
}

export function restartQuiz(moduleId: string) {
  return rpc<void>('restart_quiz', { p_module: moduleId });
}

export function completePractice(moduleId: string) {
  return rpc<void>('complete_practice', { p_module: moduleId });
}

// ---------------------------------------------------------------------
// Examen final
// ---------------------------------------------------------------------
export function fetchExamStatus() {
  return rpc<ExamStatus>('exam_status');
}

export function startExam() {
  return rpc<ExamPayload>('start_exam');
}

export function getActiveExam() {
  return rpc<ExamPayload | null>('get_active_exam');
}

export function saveExamAnswers(attemptId: string, answers: Record<string, number>) {
  return rpc<void>('save_exam_answers', { p_attempt: attemptId, p_answers: answers });
}

export function logExamEvent(attemptId: string, type: ExamEventType) {
  return rpc<number>('log_exam_event', { p_attempt: attemptId, p_type: type });
}

export function submitExam(attemptId: string, answers: Record<string, number>) {
  return rpc<ExamResult>('submit_exam', { p_attempt: attemptId, p_answers: answers });
}
