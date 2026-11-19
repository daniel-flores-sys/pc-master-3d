import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { useAuth } from './auth/AuthProvider';
import { backendMisconfigured } from './lib/insforge';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import RoadmapPage from './pages/RoadmapPage';
import { navigate, useHashRoute, type Route } from './router/useHashRoute';
import { AppHeader } from './ui/AppHeader';
import { buttonClass } from './ui/Button';
import { ErrorNotice, Spinner } from './ui/Feedback';

// Las vistas pesadas (3D, examen) se cargan bajo demanda.
const ModulePage = lazy(() => import('./pages/module/ModulePage'));
const ExamPage = lazy(() => import('./pages/exam/ExamPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const WorkshopView = lazy(() => import('./components/WorkshopView'));

const PROTECTED: Route['name'][] = ['roadmap', 'module', 'exam', 'lab', 'workshop'];

const TITLES: Partial<Record<Route['name'], string>> = {
  landing: 'PC Master 3D',
  signin: 'Iniciar sesión · PC Master 3D',
  signup: 'Crear cuenta · PC Master 3D',
  roadmap: 'Mi ruta · PC Master 3D',
  module: 'Módulo · PC Master 3D',
  exam: 'Examen final · PC Master 3D',
  lab: 'Laboratorio 3D · PC Master 3D',
  workshop: 'Taller · PC Master 3D',
};

export default function App() {
  const route = useHashRoute();
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = TITLES[route.name] ?? 'PC Master 3D';
  }, [route.name]);

  // Redirecciones según sesión
  useEffect(() => {
    if (loading) return;
    if (!user && PROTECTED.includes(route.name)) {
      navigate({ name: 'signin' }, { replace: true });
    } else if (user && (route.name === 'signin' || route.name === 'signup')) {
      navigate({ name: 'roadmap' }, { replace: true });
    }
  }, [loading, user, route.name]);

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a
        href="#contenido"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('contenido')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <AppHeader route={route} />
      {backendMisconfigured && (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <ErrorNotice>
            Falta configurar la conexión con el servidor (VITE_INSFORGE_URL y VITE_INSFORGE_ANON_KEY).
          </ErrorNotice>
        </div>
      )}
      <main id="contenido" tabIndex={-1} className="outline-none">
        {loading && PROTECTED.includes(route.name) ? (
          <Spinner label="Comprobando tu sesión…" />
        ) : (
          <Suspense fallback={<Spinner />}>
            <RouteView route={route} signedIn={!!user} />
          </Suspense>
        )}
      </main>
    </div>
  );
}

function RouteView({ route, signedIn }: { route: Route; signedIn: boolean }): ReactNode {
  if (!signedIn && PROTECTED.includes(route.name)) return <Spinner />;
  switch (route.name) {
    case 'landing':
      return <LandingPage />;
    case 'signin':
      return <AuthPage mode="signin" />;
    case 'signup':
      return <AuthPage mode="signup" />;
    case 'roadmap':
      return <RoadmapPage />;
    case 'module':
      return <ModulePage moduleId={route.moduleId} step={route.step} />;
    case 'exam':
      return <ExamPage />;
    case 'lab':
      return <LabPage device={route.device} />;
    case 'workshop':
      return <WorkshopView />;
    case 'notFound':
      return (
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl">Esta página no existe</h1>
          <a href="#/" className={`${buttonClass('primary')} mt-6`}>
            Ir al inicio
          </a>
        </div>
      );
  }
}
