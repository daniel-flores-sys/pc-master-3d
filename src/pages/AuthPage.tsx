import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { navigate } from '../router/useHashRoute';
import { Button } from '../ui/Button';
import { ErrorNotice } from '../ui/Feedback';

export default function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === 'signup';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignup && name.trim().length < 2) {
      setError('Escribe tu nombre para que aparezca en tu ruta.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        await signUp({ name: name.trim(), email: email.trim(), password });
      } else {
        await signIn({ email: email.trim(), password });
      }
      navigate({ name: 'roadmap' }, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar. Inténtalo otra vez.');
    } finally {
      setBusy(false);
    }
  }

  const field =
    'mt-1.5 block h-12 w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-base text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/25';

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_minmax(0,26rem)] md:py-20">
      <div className="max-w-md">
        <h1 className="text-[clamp(2rem,4vw,2.8rem)]">
          {isSignup ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
        </h1>
        <p className="mt-4 text-muted leading-relaxed">
          {isSignup
            ? 'Con tu cuenta guardamos en qué módulo vas, qué completaste y tu nota del examen final.'
            : 'Inicia sesión para seguir tu ruta donde la dejaste.'}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-6 sm:p-7 space-y-5">
        {isSignup && (
          <label className="block">
            <span className="font-semibold">Tu nombre</span>
            <input
              className={field}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}
        <label className="block">
          <span className="font-semibold">Correo</span>
          <input
            className={field}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="font-semibold">Contraseña</span>
          <input
            className={field}
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            aria-describedby="pw-help"
          />
          <span id="pw-help" className="mt-1.5 block text-sm text-muted">
            Mínimo 6 caracteres.
          </span>
        </label>

        {error && <ErrorNotice>{error}</ErrorNotice>}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Un momento…' : isSignup ? 'Crear cuenta' : 'Iniciar sesión'}
        </Button>

        <p className="text-sm text-muted text-center">
          {isSignup ? (
            <>
              ¿Ya tienes cuenta?{' '}
              <a href="#/entrar" className="font-semibold text-primary underline underline-offset-4">
                Inicia sesión
              </a>
            </>
          ) : (
            <>
              ¿Primera vez?{' '}
              <a href="#/registro" className="font-semibold text-primary underline underline-offset-4">
                Crea tu cuenta
              </a>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
