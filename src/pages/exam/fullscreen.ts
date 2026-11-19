/** Utilidades de pantalla completa y bloqueo de teclado (donde el navegador lo permite). */

type KeyboardLock = { lock?: (keys?: string[]) => Promise<void>; unlock?: () => void };

export function fullscreenSupported(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;
}

export async function enterFullscreen(): Promise<void> {
  if (!document.fullscreenElement) {
    // Debe llamarse dentro del gesto del usuario (clic).
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  }
  // En Chrome/Edge, en pantalla completa, Escape deja de salir con una sola pulsación.
  const kb = (navigator as Navigator & { keyboard?: KeyboardLock }).keyboard;
  try {
    await kb?.lock?.(['Escape']);
  } catch {
    /* no soportado: se detecta la salida igualmente */
  }
}

export async function leaveFullscreen(): Promise<void> {
  const kb = (navigator as Navigator & { keyboard?: KeyboardLock }).keyboard;
  try {
    kb?.unlock?.();
  } catch {
    /* ignorar */
  }
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
  }
}
