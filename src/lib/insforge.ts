import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_URL as string | undefined;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined;

/** true si faltan las variables de entorno (p. ej. build sin configurar) */
export const backendMisconfigured = !baseUrl || !anonKey;

// La anon key es pública por diseño: el acceso real lo controlan las políticas
// RLS y las funciones del servidor.
export const insforge = createClient({
  baseUrl: baseUrl ?? 'http://localhost',
  anonKey: anonKey ?? '',
});
