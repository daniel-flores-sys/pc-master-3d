import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { insforge } from '../lib/insforge';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type RawUser = {
  id: string;
  email: string;
  profile?: { name?: string | null } | null;
  name?: string | null;
} | null | undefined;

function toAppUser(raw: RawUser): AppUser | null {
  if (!raw) return null;
  const name = raw.profile?.name || raw.name || raw.email.split('@')[0];
  return { id: raw.id, email: raw.email, name };
}

function friendlyAuthError(error: { message?: string; statusCode?: number } | null): string {
  const msg = error?.message ?? '';
  if (/already|exist|registered|duplicate/i.test(msg)) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  }
  if (/invalid|credential|password|not found/i.test(msg) || error?.statusCode === 401) {
    return 'El correo o la contraseña no son correctos.';
  }
  if (/password.*(short|length|least)/i.test(msg)) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (/fetch|network/i.test(msg)) {
    return 'No hay conexión con el servidor. Revisa tu internet.';
  }
  return msg || 'No se pudo completar. Inténtalo otra vez.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await insforge.auth.getCurrentUser();
        if (!cancelled) setUser(error ? null : toAppUser(data?.user as RawUser));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const { data, error } = await insforge.auth.signUp({ email, password, name });
      if (error) throw new Error(friendlyAuthError(error));
      if (data?.requireEmailVerification) {
        throw new Error('La cuenta requiere verificar el correo. Avísale a tu docente.');
      }
      if (data?.user) {
        setUser(toAppUser({ ...(data.user as NonNullable<RawUser>), name }));
        return;
      }
      // Algunos backends no devuelven sesión al registrar: iniciar sesión explícitamente.
      const signIn = await insforge.auth.signInWithPassword({ email, password });
      if (signIn.error) throw new Error(friendlyAuthError(signIn.error));
      setUser(toAppUser(signIn.data?.user as RawUser));
    },
    [],
  );

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error));
    setUser(toAppUser(data?.user as RawUser));
  }, []);

  const signOut = useCallback(async () => {
    await insforge.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signUp, signIn, signOut }),
    [user, loading, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
