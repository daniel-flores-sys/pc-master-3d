import LabViewport from '../components/LabViewport';
import type { AppSection, DeviceModelType } from '../types/hardware';
import type { LabDevice } from '../router/useHashRoute';

const DEVICES: { slug: LabDevice; model: DeviceModelType; label: string }[] = [
  { slug: 'escritorio', model: 'desktop', label: 'PC de escritorio' },
  { slug: 'placa', model: 'motherboard', label: 'Placa madre' },
  { slug: 'laptop', model: 'laptop', label: 'Laptop' },
  { slug: 'celular', model: 'phone', label: 'Celular' },
];

const SECTION_TO_SLUG: Partial<Record<AppSection, LabDevice>> = {
  desktop: 'escritorio',
  motherboard: 'placa',
  laptop: 'laptop',
  phone: 'celular',
};

export default function LabPage({ device }: { device: LabDevice }) {
  const current = DEVICES.find((d) => d.slug === device) ?? DEVICES[0];

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="border-b border-line bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <p className="text-sm text-muted">
            Modo libre: explora sin que cuente para tu avance.
          </p>
          <nav aria-label="Equipos" className="flex flex-wrap gap-1">
            {DEVICES.map((d) => (
              <a
                key={d.slug}
                href={`#/laboratorio/${d.slug}`}
                aria-current={d.slug === current.slug ? 'page' : undefined}
                className={`rounded-[10px] px-3 py-1.5 text-sm font-semibold ${
                  d.slug === current.slug ? 'bg-primary text-on-primary' : 'text-ink hover:bg-secondary'
                }`}
              >
                {d.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1">
        <LabViewport
          modelType={current.model}
          onNavigateSection={(section) => {
            const slug = SECTION_TO_SLUG[section];
            window.location.hash = slug ? `#/laboratorio/${slug}` : '#/taller';
          }}
        />
      </div>
    </div>
  );
}
