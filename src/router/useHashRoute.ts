import { useEffect, useState } from 'react';

/**
 * Enrutado por hash (#/ruta). GitHub Pages solo sirve archivos estáticos y no
 * redirige rutas desconocidas a index.html, así que el hash evita los 404.
 */
export type Route =
  | { name: 'landing' }
  | { name: 'signin' }
  | { name: 'signup' }
  | { name: 'roadmap' }
  | { name: 'module'; moduleId: string; step: ModuleStepSlug | null }
  | { name: 'exam' }
  | { name: 'lab'; device: LabDevice }
  | { name: 'workshop' }
  | { name: 'notFound' };

export type ModuleStepSlug = 'teoria' | 'preguntas' | 'practica';
export type LabDevice = 'escritorio' | 'placa' | 'laptop' | 'celular';

const LAB_DEVICES: LabDevice[] = ['escritorio', 'placa', 'laptop', 'celular'];
const STEPS: ModuleStepSlug[] = ['teoria', 'preguntas', 'practica'];

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);

  if (parts.length === 0) return { name: 'landing' };
  const [head, a, b] = parts;

  switch (head) {
    case 'entrar':
      return { name: 'signin' };
    case 'registro':
      return { name: 'signup' };
    case 'ruta':
      return { name: 'roadmap' };
    case 'modulo':
      if (!a) return { name: 'roadmap' };
      return {
        name: 'module',
        moduleId: a,
        step: b && (STEPS as string[]).includes(b) ? (b as ModuleStepSlug) : null,
      };
    case 'examen':
      return { name: 'exam' };
    case 'laboratorio':
      return {
        name: 'lab',
        device: a && (LAB_DEVICES as string[]).includes(a) ? (a as LabDevice) : 'escritorio',
      };
    case 'taller':
      return { name: 'workshop' };
    default:
      return { name: 'notFound' };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'landing':
      return '#/';
    case 'signin':
      return '#/entrar';
    case 'signup':
      return '#/registro';
    case 'roadmap':
      return '#/ruta';
    case 'module':
      return `#/modulo/${encodeURIComponent(route.moduleId)}${route.step ? `/${route.step}` : ''}`;
    case 'exam':
      return '#/examen';
    case 'lab':
      return `#/laboratorio/${route.device}`;
    case 'workshop':
      return '#/taller';
    case 'notFound':
      return '#/';
  }
}

export function navigate(route: Route, options: { replace?: boolean } = {}) {
  const hash = routeToHash(route);
  if (options.replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

/**
 * Guardia de navegación: si devuelve false, se revierte el cambio de ruta.
 * La usa el examen para impedir salir a otras páginas (p. ej. con "Atrás").
 */
let navigationGuard: ((nextHash: string) => boolean) | null = null;
let lastHash = typeof window !== 'undefined' ? window.location.hash : '';

export function setNavigationGuard(guard: ((nextHash: string) => boolean) | null) {
  navigationGuard = guard;
  lastHash = window.location.hash;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      const next = window.location.hash;
      if (navigationGuard && next !== lastHash && !navigationGuard(next)) {
        history.replaceState(null, '', lastHash || '#/');
        return;
      }
      lastHash = next;
      setRoute(parseHash(next));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
