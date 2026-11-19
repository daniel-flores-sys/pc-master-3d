import { lazy, Suspense } from 'react';
import type { HardwareStageProps } from './HardwareStage';

// Three.js pesa ~600 kB: se carga solo cuando una vista muestra un modelo.
const HardwareStage = lazy(() => import('./HardwareStage'));

export default function LazyStage(props: HardwareStageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-stage text-sm text-muted">
          Preparando el modelo 3D…
        </div>
      }
    >
      <HardwareStage {...props} />
    </Suspense>
  );
}
