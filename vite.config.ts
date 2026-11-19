import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En GitHub Pages el sitio vive en https://<usuario>.github.io/pc-master-3d/
// En desarrollo se sirve desde la raíz.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE ?? '/pc-master-3d/') : '/',
  plugins: [react(), tailwindcss()],
  build: {
    // three.js (~650 kB) va en su propio fragmento y solo se descarga al abrir una vista 3D.
    chunkSizeWarningLimit: 700,
  },
}));
