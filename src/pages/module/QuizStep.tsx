import { Check, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CourseModule } from '../../content/modules';
import {
  answerQuizQuestion,
  fetchQuizQuestions,
  getOpenQuiz,
  restartQuiz,
  type QuizAnswerResult,
  type QuizQuestion,
} from '../../lib/api';
import { Button, buttonClass } from '../../ui/Button';
import { ErrorNotice, Spinner } from '../../ui/Feedback';

interface Props {
  mod: CourseModule;
  alreadyPassed: boolean;
  onPassed: () => Promise<void> | void;
  onProgressChanged: () => Promise<void> | void;
}

type Result = Pick<QuizAnswerResult, 'question_id' | 'selected' | 'is_correct' | 'correct_index' | 'explanation'>;

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function QuizStep({ mod, alreadyPassed, onPassed, onProgressChanged }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewOnly, setReviewOnly] = useState(alreadyPassed);
  // El resumen se muestra recién cuando el estudiante lee la última explicación.
  const [pendingSummary, setPendingSummary] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [qs, open] = await Promise.all([fetchQuizQuestions(mod.id), getOpenQuiz(mod.id)]);
      const map: Record<string, Result> = {};
      for (const a of open ?? []) map[a.question_id] = a;
      setQuestions(qs);
      setResults(map);
      const firstPending = qs.findIndex((q) => !map[q.id]);
      setIndex(firstPending === -1 ? 0 : firstPending);
      if ((open ?? []).length > 0) setReviewOnly(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las preguntas.');
    }
  }, [mod.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !questions) {
    return <ErrorNotice action={<Button variant="secondary" size="sm" onClick={() => void load()}>Reintentar</Button>}>{error}</ErrorNotice>;
  }
  if (!questions) return <Spinner label="Cargando preguntas…" />;
  if (questions.length === 0) return <ErrorNotice>Este módulo aún no tiene preguntas cargadas.</ErrorNotice>;

  // Ya aprobado y sin intento abierto: ofrecer repaso.
  if (reviewOnly) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-[1.6rem]">Ya aprobaste estas preguntas</h2>
        <p className="mt-3 text-muted">
          Puedes responderlas otra vez para repasar. Tu mejor resultado queda guardado.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => void onPassed()}>Ir a la práctica</Button>
          <Button variant="secondary" onClick={() => setReviewOnly(false)}>
            <RotateCcw className="size-4" aria-hidden="true" /> Responder de nuevo
          </Button>
        </div>
      </div>
    );
  }

  if (summary) {
    const pct = Math.round((summary.score / summary.total) * 100);
    return (
      <div className="max-w-2xl" aria-live="polite">
        <p className="text-sm font-bold text-muted">Resultado</p>
        <p className="mt-1 font-serif text-[3rem] font-semibold leading-none tabular-nums">
          {summary.score}<span className="text-muted text-[2rem]">/{summary.total}</span>
        </p>
        <h2 className="mt-4 text-[1.6rem]">
          {summary.passed ? '¡Bien! Aprobaste las preguntas.' : 'Todavía no alcanzas el 70 %.'}
        </h2>
        <p className="mt-3 text-muted">
          {summary.passed
            ? 'Ya puedes pasar a la práctica de este módulo.'
            : `Obtuviste ${pct} %. Repasa la teoría o vuelve a intentarlo; puedes hacerlo las veces que necesites.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {summary.passed ? (
            <Button size="lg" onClick={() => void onPassed()}>Ir a la práctica</Button>
          ) : (
            <>
              <Button
                size="lg"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await restartQuiz(mod.id);
                    setSummary(null);
                    setResults({});
                    setIndex(0);
                    setSelected(null);
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                <RotateCcw className="size-4" aria-hidden="true" /> Intentar de nuevo
              </Button>
              <a href={`#/modulo/${mod.id}/teoria`} className={buttonClass('secondary', 'lg')}>
                Repasar la teoría
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  const q = questions[index];
  const result = results[q.id];
  const answeredCount = Object.keys(results).length;

  async function check() {
    if (selected === null) return;
    setBusy(true);
    setError(null);
    try {
      const r = await answerQuizQuestion(q.id, selected);
      setResults((prev) => ({ ...prev, [q.id]: r }));
      if (r.finished && r.score != null) {
        setPendingSummary({ score: r.score, total: r.total, passed: !!r.passed });
        await onProgressChanged();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo comprobar la respuesta.');
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setSelected(null);
    if (pendingSummary) {
      setSummary(pendingSummary);
      setPendingSummary(null);
      return;
    }
    const nextIndex = questions!.findIndex((qq, i) => i > index && !results[qq.id]);
    const wrap = questions!.findIndex((qq) => !results[qq.id]);
    setIndex(nextIndex !== -1 ? nextIndex : wrap !== -1 ? wrap : index);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-muted tabular-nums" aria-live="polite">
        Pregunta {index + 1} de {questions.length}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {questions.map((qq, i) => {
          const r = results[qq.id];
          return (
            <span
              key={qq.id}
              className={`h-1.5 flex-1 rounded-full ${
                r ? (r.is_correct ? 'bg-success' : 'bg-danger') : i === index ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          );
        })}
      </div>

      <p className="mt-6 text-sm font-semibold text-primary">{q.topic}</p>
      <h2 ref={headingRef} tabIndex={-1} className="mt-1 text-[1.5rem] leading-snug outline-none">
        {q.prompt}
      </h2>

      <fieldset className="mt-6" disabled={!!result || busy}>
        <legend className="sr-only">Opciones</legend>
        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isSel = (result ? result.selected : selected) === i;
            const isCorrect = result && i === result.correct_index;
            const isWrongPick = result && isSel && !result.is_correct;
            const cls = result
              ? isCorrect
                ? 'border-success bg-success-soft'
                : isWrongPick
                  ? 'border-danger bg-danger-soft'
                  : 'border-line opacity-70'
              : isSel
                ? 'border-primary bg-primary-soft'
                : 'border-line-strong hover:border-primary bg-surface';
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary ${cls}`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  className="sr-only"
                  checked={isSel}
                  onChange={() => setSelected(i)}
                />
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isCorrect ? 'bg-success text-[var(--c-surface)]' : isWrongPick ? 'bg-danger text-[var(--c-surface)]' : isSel ? 'bg-primary text-on-primary' : 'bg-secondary text-ink'
                  }`}
                  aria-hidden="true"
                >
                  {isCorrect ? <Check className="size-4" strokeWidth={3} /> : isWrongPick ? <X className="size-4" strokeWidth={3} /> : LETTERS[i]}
                </span>
                <span className="pt-0.5 leading-snug">{opt}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {result && (
        <div
          role="status"
          className={`mt-5 rounded-xl border p-4 ${result.is_correct ? 'border-success/50 bg-success-soft' : 'border-danger/40 bg-danger-soft'}`}
        >
          <p className="font-bold">{result.is_correct ? 'Correcto.' : 'No es correcto.'}</p>
          <p className="mt-1 leading-relaxed">{result.explanation}</p>
        </div>
      )}

      {error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}

      <div className="mt-6">
        {result ? (
          <Button size="lg" onClick={next}>
            {pendingSummary || answeredCount === questions.length ? 'Ver mi resultado' : 'Siguiente pregunta'}
          </Button>
        ) : (
          <Button size="lg" onClick={() => void check()} disabled={selected === null || busy}>
            {busy ? 'Comprobando…' : 'Comprobar respuesta'}
          </Button>
        )}
      </div>
    </div>
  );
}
