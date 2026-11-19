import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import { courseModules } from '../content/modules';
import { fetchProgress, type ModuleProgressRow } from './api';
import { computeCourseState, type CourseState } from './courseLogic';

interface ProgressContextValue {
  rows: ModuleProgressRow[];
  course: CourseState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MODULE_IDS = courseModules.map((m) => m.id);
const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<ModuleProgressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchProgress());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar tu progreso.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const course = useMemo(() => computeCourseState(MODULE_IDS, rows), [rows]);

  const value = useMemo(
    () => ({ rows, course, loading, error, refresh }),
    [rows, course, loading, error, refresh],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress debe usarse dentro de <ProgressProvider>');
  return ctx;
}
