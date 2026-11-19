import { AlertTriangle, ArrowLeft, ArrowRight, Clock, Maximize } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  logExamEvent,
  saveExamAnswers,
  submitExam,
  type ExamEventType,
  type ExamPayload,
  type ExamResult,
} from '../../lib/api';
import { formatClock, remainingMs } from '../../lib/courseLogic';
import { setNavigationGuard } from '../../router/useHashRoute';
import { Button } from '../../ui/Button';
import { ErrorNotice } from '../../ui/Feedback';
import { Modal } from '../../ui/Modal';
import { enterFullscreen, leaveFullscreen } from './fullscreen';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const VIOLATION_TYPES: ExamEventType[] = ['fullscreen_exit', 'tab_hidden', 'window_blur'];

interface Props {
  payload: ExamPayload;
  receivedAt: number;
  onFinished: (result: ExamResult) => void;
}

export default function ExamRunner({ payload, receivedAt, onFinished }: Props) {
  const questions = payload.questions;
  const [answers, setAnswers] = useState<Record<string, number>>(payload.answers ?? {});
  const [index, setIndex] = useState(() => {
    const first = questions.findIndex((q) => payload.answers?.[q.id] === undefined);
    return first === -1 ? 0 : first;
  });
  const [violations, setViolations] = useState(payload.violations);
  const [blocked, setBlocked] = useState(!document.fullscreenElement);
  const [left, setLeft] = useState(() => remainingMs(payload.deadline, payload.server_now, receivedAt, Date.now()));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittingRef = useRef(false);
  const lastViolationAt = useRef(0);
  const lastMinorAt = useRef(0);

  const submit = useCallback(
    async (reason: 'manual' | 'time' | 'violations') => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      setError(null);
      try {
        const result = await submitExam(payload.attempt_id, answersRef.current);
        await leaveFullscreen();
        onFinished(result);
      } catch (e) {
        submittingRef.current = false;
        setSubmitting(false);
        setError(
          (e instanceof Error ? e.message : 'No se pudo entregar.') +
            (reason === 'manual' ? '' : ' Tus respuestas siguen guardadas: vuelve a intentar la entrega.'),
        );
      }
    },
    [onFinished, payload.attempt_id],
  );

  const report = useCallback(
    async (type: ExamEventType) => {
      if (submittingRef.current) return;
      const now = Date.now();
      if (VIOLATION_TYPES.includes(type)) {
        // Salir de pantalla completa suele disparar también blur/visibilidad: se cuenta una sola vez.
        if (now - lastViolationAt.current < 2000) return;
        lastViolationAt.current = now;
      } else {
        if (now - lastMinorAt.current < 3000) return;
        lastMinorAt.current = now;
      }
      try {
        const count = await logExamEvent(payload.attempt_id, type);
        setViolations(count);
        if (count >= payload.max_violations) void submit('violations');
      } catch {
        /* si falla el registro, el examen continúa; el servidor igual controla el tiempo */
      }
    },
    [payload.attempt_id, payload.max_violations, submit],
  );

  // Reloj basado en el plazo del servidor
  useEffect(() => {
    const t = window.setInterval(() => {
      const ms = remainingMs(payload.deadline, payload.server_now, receivedAt, Date.now());
      setLeft(ms);
      if (ms <= 0) void submit('time');
    }, 500);
    return () => window.clearInterval(t);
  }, [payload.deadline, payload.server_now, receivedAt, submit]);

  // Durante el examen no se puede navegar a otras páginas de la app (p. ej. con "Atrás").
  useEffect(() => {
    setNavigationGuard(() => {
      if (submittingRef.current) return true;
      void report('fullscreen_exit');
      return false;
    });
    return () => setNavigationGuard(null);
  }, [report]);

  // Vigilancia: pantalla completa, pestaña, ventana, copiar/pegar, menú contextual, salida de la página
  useEffect(() => {
    const onFs = () => {
      if (submittingRef.current) return;
      if (!document.fullscreenElement) {
        setBlocked(true);
        void report('fullscreen_exit');
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void report('tab_hidden');
    };
    const onBlur = () => void report('window_blur');
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      void report('copy_attempt');
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      void report('context_menu');
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (submittingRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('paste', onCopy);
    document.addEventListener('contextmenu', onContext);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('paste', onCopy);
      document.removeEventListener('contextmenu', onContext);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [report]);

  const choose = (qid: string, option: number) => {
    setAnswers((a) => ({ ...a, [qid]: option }));
    // Guardado inmediato; si falla, la entrega final igual envía todas las respuestas.
    void saveExamAnswers(payload.attempt_id, { [qid]: option }).catch(() => {});
  };

  const q = questions[index];
  const answeredCount = questions.filter((qq) => answers[qq.id] !== undefined).length;
  const lowTime = left < 5 * 60_000;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-canvas text-ink select-none">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-4 py-3 sm:px-6">
        <p className="font-serif text-lg font-semibold">Examen final</p>
        <p className="text-sm text-muted tabular-nums">
          {answeredCount} de {questions.length} respondidas
        </p>
        {violations > 0 && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-sm font-semibold text-danger">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Advertencias: {violations} de {payload.max_violations}
          </p>
        )}
        <p
          className={`ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-bold tabular-nums ${
            lowTime ? 'bg-danger-soft text-danger' : 'bg-secondary'
          }`}
          aria-live={lowTime ? 'polite' : 'off'}
        >
          <Clock className="size-4" aria-hidden="true" />
          <span aria-label="Tiempo restante">{formatClock(left)}</span>
        </p>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Pregunta */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-10">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-semibold text-muted tabular-nums">
              Pregunta {index + 1} de {questions.length}
            </p>
            <p className="mt-4 text-sm font-semibold text-primary">{q.topic}</p>
            <h1 className="mt-1 text-[1.5rem] leading-snug">{q.prompt}</h1>

            <fieldset className="mt-6" disabled={submitting}>
              <legend className="sr-only">Opciones</legend>
              <div className="space-y-2.5">
                {q.options.map((opt, i) => {
                  const isSel = answers[q.id] === i;
                  return (
                    <label
                      key={i}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary ${
                        isSel ? 'border-primary bg-primary-soft' : 'border-line-strong bg-surface hover:border-primary'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`exam-${q.id}`}
                        className="sr-only"
                        checked={isSel}
                        onChange={() => choose(q.id, i)}
                      />
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isSel ? 'bg-primary text-on-primary' : 'bg-secondary'
                        }`}
                        aria-hidden="true"
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="pt-0.5 leading-snug">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Anterior
              </Button>
              {index < questions.length - 1 ? (
                <Button onClick={() => setIndex((i) => i + 1)}>
                  Siguiente <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
                  Revisar y entregar
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Navegador de preguntas */}
        <nav aria-label="Preguntas" className="hidden w-64 shrink-0 overflow-y-auto border-l border-line bg-surface p-5 md:block">
          <p className="text-sm font-bold">Preguntas</p>
          <ol className="mt-3 grid grid-cols-5 gap-2">
            {questions.map((qq, i) => {
              const answered = answers[qq.id] !== undefined;
              const current = i === index;
              return (
                <li key={qq.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={current ? 'step' : undefined}
                    aria-label={`Pregunta ${i + 1}${answered ? ', respondida' : ''}`}
                    className={`flex size-9 items-center justify-center rounded-md text-sm font-bold tabular-nums ${
                      current
                        ? 'bg-primary text-on-primary'
                        : answered
                          ? 'bg-accent-soft border border-accent-strong/50'
                          : 'border border-line-strong text-muted'
                    }`}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
          <Button className="mt-6 w-full" onClick={() => setConfirmOpen(true)} disabled={submitting}>
            Entregar examen
          </Button>
        </nav>
      </div>

      {/* Bloqueo al salir de pantalla completa */}
      {blocked && !submitting && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="blocked-title" className="fixed inset-0 z-[120] flex items-center justify-center bg-canvas/97 p-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto size-10 text-danger" aria-hidden="true" />
            <h2 id="blocked-title" className="mt-4 text-[1.7rem]">Saliste de la pantalla completa</h2>
            <p className="mt-3 leading-relaxed text-muted">
              Quedó registrado como advertencia ({violations} de {payload.max_violations}). El tiempo sigue corriendo.
              Vuelve a la pantalla completa para continuar.
            </p>
            <Button
              size="lg"
              className="mt-6"
              onClick={() => {
                enterFullscreen()
                  .then(() => setBlocked(false))
                  .catch(() => setError('No se pudo volver a la pantalla completa. Inténtalo de nuevo.'));
              }}
            >
              <Maximize className="size-4" aria-hidden="true" /> Volver a pantalla completa
            </Button>
          </div>
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-canvas/95">
          <p className="font-serif text-xl font-semibold" role="status">Entregando tu examen…</p>
        </div>
      )}

      <Modal open={confirmOpen} title="Entregar examen" onClose={() => setConfirmOpen(false)}>
        <h2 className="text-[1.5rem]">¿Entregar el examen?</h2>
        <p className="mt-3 leading-relaxed">
          Respondiste <strong>{answeredCount} de {questions.length}</strong> preguntas.
          {answeredCount < questions.length && ' Las que dejes sin responder cuentan como incorrectas.'}
          {' '}Después de entregar no podrás cambiar tus respuestas.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Seguir revisando
          </Button>
          <Button onClick={() => void submit('manual')}>Entregar examen</Button>
        </div>
      </Modal>
    </div>
  );
}
