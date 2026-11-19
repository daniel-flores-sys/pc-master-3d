import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type PaletteId = 'cobalto' | 'indigo' | 'marfil' | 'arena';
export type ModePreference = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

export interface PaletteInfo {
  id: PaletteId;
  name: string;
  description: string;
  /** Muestras para el selector: [primary, accent, background] en claro y oscuro */
  swatches: { light: [string, string, string]; dark: [string, string, string] };
}

export const PALETTES: PaletteInfo[] = [
  {
    id: 'marfil',
    name: 'Papel Marfil y Zafiro',
    description: 'Fondo tipo papel, cómodo para leer mucho rato.',
    swatches: { light: ['#1D4ED8', '#D97706', '#F7F4EE'], dark: ['#6EA8FE', '#FBBF24', '#161411'] },
  },
  {
    id: 'cobalto',
    name: 'Pizarra Cobalto',
    description: 'Moderno y técnico, transmite orden.',
    swatches: { light: ['#2563EB', '#0D9488', '#F6F8FB'], dark: ['#60A5FA', '#2DD4BF', '#0B1120'] },
  },
  {
    id: 'indigo',
    name: 'Niebla Índigo',
    description: 'Sereno y editorial, con menos brillo azul.',
    swatches: { light: ['#3B5BDB', '#0CA678', '#F3F5F9'], dark: ['#748FFC', '#38D9A9', '#11141D'] },
  },
  {
    id: 'arena',
    name: 'Arena y Azul Petróleo',
    description: 'Cálido y amable, con azul petróleo profundo.',
    swatches: { light: ['#0F5C78', '#C26D3A', '#F4F1EA'], dark: ['#4DB6AC', '#E08E5B', '#141312'] },
  },
];

const PALETTE_KEY = 'pcm3d.palette';
const MODE_KEY = 'pcm3d.mode';

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: el tema igual funciona en esta sesión */
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export interface StageColors {
  background: string;
  grid: string;
  highlight: string;
}

interface ThemeContextValue {
  palette: PaletteId;
  modePreference: ModePreference;
  mode: ResolvedMode;
  setPalette: (p: PaletteId) => void;
  setModePreference: (m: ModePreference) => void;
  /** Colores leídos de los tokens CSS para la escena 3D */
  stageColors: StageColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStageColors(): StageColors {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    background: get('--c-stage', '#ece8df'),
    grid: get('--c-stage-grid', '#d4cdbe'),
    highlight: get('--c-primary', '#1d4ed8'),
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>(() =>
    readStored(PALETTE_KEY, ['cobalto', 'indigo', 'marfil', 'arena'] as const, 'marfil'),
  );
  const [modePreference, setModePreferenceState] = useState<ModePreference>(() =>
    readStored(MODE_KEY, ['light', 'dark', 'system'] as const, 'system'),
  );
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const [stageColors, setStageColors] = useState<StageColors>(() => readStageColors());

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const mode: ResolvedMode =
    modePreference === 'system' ? (systemDark ? 'dark' : 'light') : modePreference;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', palette);
    root.setAttribute('data-mode', mode);
    setStageColors(readStageColors());
  }, [palette, mode]);

  const setPalette = useCallback((p: PaletteId) => {
    setPaletteState(p);
    writeStored(PALETTE_KEY, p);
  }, []);

  const setModePreference = useCallback((m: ModePreference) => {
    setModePreferenceState(m);
    writeStored(MODE_KEY, m);
  }, []);

  const value = useMemo(
    () => ({ palette, modePreference, mode, setPalette, setModePreference, stageColors }),
    [palette, modePreference, mode, setPalette, setModePreference, stageColors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
