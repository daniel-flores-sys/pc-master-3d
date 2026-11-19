import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { Route } from '../router/useHashRoute';
import { buttonClass } from './Button';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Wordmark } from './Wordmark';

const NAV: { label: string; href: string; match: Route['name'][] }[] = [
  { label: 'Mi ruta', href: '#/ruta', match: ['roadmap', 'module', 'exam'] },
  { label: 'Laboratorio 3D', href: '#/laboratorio/escritorio', match: ['lab'] },
  { label: 'Taller', href: '#/taller', match: ['workshop'] },
];

export function AppHeader({ route }: { route: Route }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/92 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <a href={user ? '#/ruta' : '#/'} className="rounded-lg" aria-label="PC Master 3D, inicio">
          <Wordmark />
        </a>

        {user && (
          <nav aria-label="Principal" className="ml-6 hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.match.includes(route.name);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
                    active ? 'bg-secondary text-ink' : 'text-muted hover:text-ink hover:bg-secondary/70'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitcher />
          {user ? (
            <>
              <span className="hidden lg:inline text-sm text-muted px-2 max-w-[12rem] truncate" title={user.email}>
                {user.name}
              </span>
              <button
                type="button"
                onClick={() => void signOut().then(() => (window.location.hash = '#/'))}
                className="hidden md:inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-ink hover:bg-secondary"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Salir
              </button>
              <button
                type="button"
                className="md:hidden inline-flex size-10 items-center justify-center rounded-[10px] hover:bg-secondary"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </>
          ) : (
            route.name !== 'signin' && (
              <a href="#/entrar" className={buttonClass('secondary', 'sm')}>
                Iniciar sesión
              </a>
            )
          )}
        </div>
      </div>

      {user && menuOpen && (
        <nav aria-label="Principal" className="md:hidden border-t border-line bg-surface px-4 py-3">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 font-semibold text-ink hover:bg-secondary"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="border-t border-line pt-2 mt-2">
              <p className="px-3 pb-1 text-sm text-muted truncate">{user.email}</p>
              <button
                type="button"
                onClick={() => void signOut().then(() => (window.location.hash = '#/'))}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 font-semibold text-ink hover:bg-secondary"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
