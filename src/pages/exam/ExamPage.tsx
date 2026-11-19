import { Clock, Maximize, ShieldAlert, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchExamStatus,
  getActiveExam,
  logExamEvent,
  startExam,
  type ExamPayload,
  type ExamResult,
  type ExamStatus,
} from '../../lib/api';
import { useProgress } from '../../lib/ProgressProvider';
import { Button, buttonClass } from '../../ui/Button';
import { ErrorNotice, ProgressBar, Spinner } from '../../ui/Feedback';
import { Modal } from '../../ui/Modal';
import ExamResultView from './ExamResultView';
import ExamRunner from './ExamRunner';
import { enterFullscreen, fullscreenSupported } from './fullscreen';

const GATE_SECONDS = 15;

export default function ExamPage() {
  const { refresh: refreshProgress } = useProgress();
  const [status, setStatus] = useState<ExamStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [payload, setPayload] = useState<{ data: ExamPayload; receivedAt: number } | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStatus(await fetchExamStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el examen.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (payload && !result) {
    return (
      <ExamRunner
        payload={payload.data}
        receivedAt={payload.receivedAt}
        onFinished={(r) => {
          setResult(r);
          setPayload(null);
          void load();
          void refreshProgress();
        }}
      />
    );
  }

  if (result) {
    return (
      <ExamResultView
        result={result}
        onBack={() => {
          setResult(null);
        }}
      />
    );
  }

  if (error && !status) {
    return (
      <Shell>
        <ErrorNotice action={<Button variant="secondary" size="sm" onClick={() => void load()}>Reintentar</Button>}>
          {error}
        </ErrorNotice>
      </Shell>
    );
  }
  if (!status) return <Spinner label="Cargando el examen…" />;

  const attemptsLeft = Math.max(0, status.max_attempts - status.attempts_used);

  // Entrar o retomar: la pantalla completa debe pedirse dentro del clic.
  const begin = async (resume: boolean) => {
    setError(null);
    try {
      await enterFullscreen();
    } catch {
      setError('Tu navegador no permitió la pantalla completa. Usa Chrome, Edge o Firefox en una computadora e inténtalo de nuevo.');
      return;
    }
    try {
      const data = resume ? await getActiveExam() : await startExam();
      if (!data) {
        await load();
        throw new Error('Ese intento ya terminó.');
      }
      if (resume) void logExamEvent(data.attempt_id, 'resumed').catch(() => {});
      setGateOpen(false);
      setPayload({ data, receivedAt: Date.now() });
    } catch (e) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el examen.');
    }
  };

  return (
    <Shell>
      <h1 className="text-[clamp(2rem,4vw,2.6rem)]">Examen final</h1>

      {status.passed ? (
        <div className="mt-6 rounded-2xl border border-accent-strong bg-accent-soft p-6">
          <Trophy className="size-8 text-accent-strong" aria-hidden="true" />
          <p className="mt-3 font-serif text-2xl font-semibold">Aprobaste el examen final</p>
          <p className="mt-2">
            Tu mejor resultado: <span className="font-bold tabular-nums">{status.best_score}/{status.best_total}</span>.
            ¡Completaste el curso!
          </p>
          <a href="#/ruta" className={`${buttonClass('secondary')} mt-5`}>Volver a mi ruta</a>
        </div>
      ) : !status.eligible ? (
        <div className="mt-6 max-w-xl">
          <p className="text-muted">
            El examen se habilita cuando completes los {status.modules_total} módulos de tu ruta.
          </p>
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">
              {status.modules_done} de {status.modules_total} módulos completados
            </p>
            <ProgressBar value={status.modules_done} max={status.modules_total} label="Módulos completados" />
          </div>
          <a href="#/ruta" className={`${buttonClass('primary')} mt-6`}>Seguir mi ruta</a>
        </div>
      ) : status.active_attempt ? (
        <div className="mt-6 max-w-xl rounded-2xl border border-primary bg-primary-soft p-6">
          <p className="font-serif text-xl font-semibold">Tienes un examen en curso</p>
          <p className="mt-2 leading-relaxed">
            El tiempo sigue corriendo. Vuelve a entrar en pantalla completa para continuar donde lo dejaste;
            tus respuestas están guardadas.
          </p>
          {error && <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>}
          <Button size="lg" className="mt-5" onClick={() => void begin(true)}>
            <Maximize className="size-4" aria-hidden="true" /> Volver al examen
          </Button>
        </div>
      ) : attemptsLeft === 0 ? (
        <div className="mt-6 max-w-xl">
          <p className="leading-relaxed">
            Usaste tus {status.max_attempts} intentos. Tu mejor resultado fue{' '}
            <span className="font-bold tabular-nums">{status.best_score}/{status.best_total}</span>.
            Habla con tu docente si necesitas otra oportunidad.
          </p>
          <a href="#/ruta" className={`${buttonClass('secondary')} mt-5`}>Volver a mi ruta</a>
        </div>
      ) : (
        <>
          <dl className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
            <Fact label="Preguntas" value={String(status.question_count)} />
            <Fact label="Tiempo" value={`${status.minutes} minutos`} />
            <Fact label="Para aprobar" value={`${status.pass_pct} % o más`} />
          </dl>
          <p className="mt-6 max-w-2xl text-muted leading-relaxed">
            Te quedan <span className="font-bold text-ink">{attemptsLeft} de {status.max_attempts}</span> intentos.
            El examen se rinde en pantalla completa desde una computadora. Antes de empezar, cierra otras pestañas
            y asegúrate de tener buena conexión.
          </p>
          {fullscreenSupported() ? (
            <Button size="lg" className="mt-6" onClick={() => setGateOpen(true)}>
              Prepararme para el examen
            </Button>
          ) : (
            <div className="mt-6 max-w-2xl">
              <ErrorNotice>
                Este navegador no permite la pantalla completa (suele pasar en celulares). Entra desde una computadora
                con Chrome, Edge o Firefox para rendir el examen.
              </ErrorNotice>
            </div>
          )}
          <ExamGate
            open={gateOpen}
            status={status}
            error={error}
            onClose={() => setGateOpen(false)}
            onStart={() => void begin(false)}
          />
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-xl font-semibold">{value}</dd>
    </div>
  );
}

function ExamGate({
  open,
  status,
  error,
  onClose,
  onStart,
}: {
  open: boolean;
  status: ExamStatus;
  error: string | null;
  onClose: () => void;
  onStart: () => void;
}) {
  const [seconds, setSeconds] = useState(GATE_SECONDS);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSeconds(GATE_SECONDS);
    setAgreed(false);
    setStarting(false);
    const t = window.setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (error) setStarting(false);
  }, [error]);

  const ready = seconds === 0 && agreed && !starting;

  return (
    <Modal open={open} title="Antes de empezar el examen" onClose={onClose}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="size-6 shrink-0 text-danger mt-1" aria-hidden="true" />
        <h2 className="text-[1.5rem]">Antes de empezar</h2>
      </div>
      <p className="mt-3 leading-relaxed">
        El examen se hará con el navegador en <strong>pantalla completa</strong>. Lee estas reglas:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
        <li>
          Tienes <strong>{status.minutes} minutos</strong> desde que empiezas. El reloj sigue corriendo aunque
          cierres la página.
        </li>
        <li>
          Salir de la pantalla completa, cambiar de pestaña o de ventana cuenta como una advertencia y queda
          registrado.
        </li>
        <li>
          Con <strong>{status.max_violations} advertencias</strong> el examen se entrega automáticamente con lo que
          hayas respondido.
        </li>
        <li>Tus respuestas se guardan a medida que contestas.</li>
      </ul>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg bg-secondary p-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-[var(--c-primary)]"
        />
        <span>Leí las reglas y voy a rendir el examen por mi cuenta.</span>
      </label>

      {error && <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Todavía no
        </Button>
        <Button
          size="lg"
          disabled={!ready}
          onClick={() => {
            setStarting(true);
            onStart();
          }}
        >
          {seconds > 0 ? (
            <>
              <Clock className="size-4" aria-hidden="true" />
              <span className="tabular-nums">Podrás empezar en {seconds} s</span>
            </>
          ) : starting ? (
            'Abriendo…'
          ) : (
            'Empezar examen'
          )}
        </Button>
      </div>
    </Modal>
  );
}
