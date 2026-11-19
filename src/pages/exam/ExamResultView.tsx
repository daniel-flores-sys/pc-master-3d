import { Check, Trophy, X } from 'lucide-react';
import type { ExamResult } from '../../lib/api';
import { Button, buttonClass } from '../../ui/Button';

export default function ExamResultView({ result, onBack }: { result: ExamResult; onBack: () => void }) {
  const pct = Math.round((result.score / Math.max(1, result.total)) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-live="polite">
      {result.passed && <Trophy className="size-10 text-accent-strong" aria-hidden="true" />}
      <p className="mt-4 text-sm font-bold text-muted">Tu resultado</p>
      <p className="mt-1 font-serif text-[3.5rem] font-semibold leading-none tabular-nums">
        {result.score}
        <span className="text-[2.2rem] text-muted">/{result.total}</span>
      </p>
      <h1 className="mt-5 text-[clamp(1.8rem,4vw,2.4rem)]">
        {result.passed ? '¡Aprobaste el examen final!' : 'Esta vez no alcanzaste el puntaje'}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        {result.status === 'expired' && 'El tiempo terminó y se entregó lo que tenías respondido. '}
        Obtuviste {pct} %; para aprobar se necesita {result.pass_pct} %.{' '}
        {!result.passed &&
          (result.attempts_left > 0
            ? `Te queda ${result.attempts_left} intento. Repasa los temas de abajo antes de volver a rendir.`
            : 'Ya no te quedan intentos. Habla con tu docente.')}
      </p>

      {!result.passed && result.topics_to_review.length > 0 && (
        <section className="mt-8 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xl">Temas para repasar</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.topics_to_review.map((t) => (
              <li key={t} className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="#/ruta" className={buttonClass('primary', 'lg')}>
          Volver a mi ruta
        </a>
        {!result.passed && result.attempts_left > 0 && (
          <Button variant="secondary" size="lg" onClick={onBack}>
            Ver mis intentos
          </Button>
        )}
      </div>

      {result.review && (
        <section className="mt-12">
          <h2 className="text-2xl">Revisión pregunta por pregunta</h2>
          <ol className="mt-5 space-y-5">
            {result.review.map((q, i) => {
              const ok = q.selected === q.correct_index;
              return (
                <li key={q.id} className="rounded-xl border border-line bg-surface p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {ok ? (
                      <Check className="size-4 text-success" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <X className="size-4 text-danger" strokeWidth={3} aria-hidden="true" />
                    )}
                    <span className="text-muted">Pregunta {i + 1}, {q.topic}</span>
                  </p>
                  <p className="mt-2 font-semibold leading-snug">{q.prompt}</p>
                  <p className="mt-3 text-[0.95rem]">
                    <span className="text-muted">Respuesta correcta: </span>
                    {q.options[q.correct_index]}
                  </p>
                  {!ok && (
                    <p className="mt-1 text-[0.95rem]">
                      <span className="text-muted">Tu respuesta: </span>
                      {q.selected == null ? 'sin responder' : q.options[q.selected]}
                    </p>
                  )}
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{q.explanation}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
