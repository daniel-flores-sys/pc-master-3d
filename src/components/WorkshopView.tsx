import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  RotateCw,
  ShieldAlert,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useState } from 'react';
import { maintenanceTutorials, workshopTools } from '../data/workshopData';
import LazyStage from '../three/LazyStage';
import { toggleChecklistStep } from '../utils/labLogic';

type TutorialFilter = 'all' | 'PC de Escritorio' | 'Teléfono Celular';

export default function WorkshopView() {
  const [selectedToolId, setSelectedToolId] = useState(workshopTools[0].id);
  const [toolAutoRotate, setToolAutoRotate] = useState(false);
  const [toolZoom, setToolZoom] = useState({ delta: 1, seq: 0 });

  const [deviceFilter, setDeviceFilter] = useState<TutorialFilter>('all');
  const [selectedTutorialId, setSelectedTutorialId] = useState(
    maintenanceTutorials[0].id,
  );
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const selectedTool =
    workshopTools.find((t) => t.id === selectedToolId) ?? workshopTools[0];

  const filteredTutorials =
    deviceFilter === 'all'
      ? maintenanceTutorials
      : maintenanceTutorials.filter((t) => t.device === deviceFilter);

  const selectedTutorial =
    filteredTutorials.find((t) => t.id === selectedTutorialId) ??
    filteredTutorials[0] ??
    maintenanceTutorials[0];

  const doneInTutorial = selectedTutorial.steps.filter(
    (_, idx) => completedSteps[`${selectedTutorial.id}_${idx}`],
  ).length;

  return (
    <div className="flex-1 bg-canvas px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Mandatory Global Safety Banner */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-primary">
                Práctica guiada y herramientas 3D
              </p>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-ink mt-0.5">
                Taller de Mantenimiento
              </h1>
            </div>
            <p className="text-xs text-muted">
              {workshopTools.length} herramientas 3D · {maintenanceTutorials.length} tutoriales paso a paso
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-accent-soft border border-accent/50 flex flex-col sm:flex-row sm:items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-accent-strong shrink-0" />
            <div className="text-xs sm:text-sm text-ink space-y-0.5">
              <p className="font-semibold text-accent-strong">
                Reglas de seguridad obligatorias antes de intervenir cualquier equipo
              </p>
              <p>
                Desconecta siempre el equipo de la red eléctrica (y la batería interna en laptops o celulares), descarga tu electricidad estática con pulsera ESD, nunca abras la fuente de alimentación ATX (conserva voltajes letales) y jamás perfores, dobles ni calientes excesivamente baterías de litio.
              </p>
            </div>
          </div>
        </header>

        {/* Section 1: 3D Tools Showcase */}
        <section className="rounded-2xl bg-surface border border-line overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Wrench className="w-5 h-5 text-primary" />
              <h2 className="font-serif font-semibold text-lg text-ink">
                Herramientas de mantenimiento en 3D
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setToolAutoRotate((r) => !r)}
                aria-pressed={toolAutoRotate}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  toolAutoRotate
                    ? 'bg-primary-soft text-primary border-primary/60'
                    : 'bg-secondary text-ink border-line-strong hover:border-primary'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Girar 360°</span>
              </button>
              <button
                type="button"
                onClick={() => setToolZoom((z) => ({ delta: 0.82, seq: z.seq + 1 }))}
                aria-label="Acercar herramienta 3D"
                className="p-1.5 rounded-lg bg-secondary text-ink border border-line-strong hover:border-primary cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setToolZoom((z) => ({ delta: 1.22, seq: z.seq + 1 }))}
                aria-label="Alejar herramienta 3D"
                className="p-1.5 rounded-lg bg-secondary text-ink border border-line-strong hover:border-primary cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Tool selector list */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-line p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
              {workshopTools.map((tool) => {
                const isSel = tool.id === selectedTool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setSelectedToolId(tool.id)}
                    className={`px-3.5 py-2.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      isSel
                        ? 'bg-primary-soft border-primary/60 text-ink'
                        : 'bg-secondary/50 border-line text-ink hover:bg-secondary hover:text-ink'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{tool.name}</span>
                    <span className="block text-xs text-muted mt-0.5">
                      {tool.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3D Tool Canvas + Details */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="h-[320px] sm:h-[360px] relative">
                <LazyStage
                  modelType="tool"
                  toolId={selectedTool.id}
                  selectedId={null}
                  autoRotate={toolAutoRotate}
                  zoomTrigger={toolZoom}
                  testId="workshop-tool-stage"
                />
              </div>
              <div className="p-5 border-t border-line bg-canvas space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif font-bold text-lg text-ink">
                    {selectedTool.name}
                  </h3>
                  <span className="text-xs font-medium text-primary">
                    {selectedTool.category}
                  </span>
                </div>
                <p className="text-sm text-ink leading-relaxed">
                  {selectedTool.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-line text-xs leading-relaxed">
                  <div>
                    <p className="font-semibold text-primary mb-1">Uso recomendado</p>
                    <p className="text-ink">{selectedTool.usage}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-accent-strong mb-1">Precaución</p>
                    <p className="text-ink">{selectedTool.precaution}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Step-by-step Maintenance Tutorials */}
        <section className="rounded-2xl bg-surface border border-line overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-semibold text-lg text-ink">
                Tutoriales paso a paso de mantenimiento
              </h2>
              <p className="text-xs text-muted">
                Marca cada paso completado mientras practicas el procedimiento
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary border border-line">
              {(
                [
                  { id: 'all', label: 'Todos (17)' },
                  { id: 'PC de Escritorio', label: 'PC de Escritorio (11)' },
                  { id: 'Teléfono Celular', label: 'Celulares (6)' },
                ] as { id: TutorialFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setDeviceFilter(tab.id);
                    const nextList =
                      tab.id === 'all'
                        ? maintenanceTutorials
                        : maintenanceTutorials.filter((t) => t.device === tab.id);
                    if (nextList.length > 0 && !nextList.some((t) => t.id === selectedTutorialId)) {
                      setSelectedTutorialId(nextList[0].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    deviceFilter === tab.id
                      ? 'bg-primary text-on-primary'
                      : 'text-ink hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Tutorial Selector List */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-line p-3 max-h-[540px] overflow-y-auto space-y-1.5">
              {filteredTutorials.map((tut) => {
                const isSel = tut.id === selectedTutorial.id;
                return (
                  <button
                    key={tut.id}
                    type="button"
                    onClick={() => setSelectedTutorialId(tut.id)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-left border transition-colors cursor-pointer ${
                      isSel
                        ? 'bg-primary-soft border-primary/60 text-ink'
                        : 'bg-secondary/40 border-line text-ink hover:bg-secondary hover:text-ink'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{tut.title}</span>
                    <div className="flex items-center gap-2 text-xs text-muted mt-1">
                      <span>{tut.device}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tut.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tut.duration}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Tutorial Guide */}
            <div className="lg:col-span-8 p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <span>{selectedTutorial.device}</span>
                    <span aria-hidden="true">·</span>
                    <span>Nivel {selectedTutorial.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedTutorial.duration}</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-ink mt-1">
                    {selectedTutorial.title}
                  </h3>
                </div>
                <div className="text-xs tabular-nums text-ink bg-secondary border border-line px-3 py-1.5 rounded-lg tabular-nums">
                  {doneInTutorial} / {selectedTutorial.steps.length} pasos completados
                </div>
              </div>

              <p className="text-sm text-ink leading-relaxed">
                {selectedTutorial.summary}
              </p>

              {/* Tools required */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-ink">
                  Herramientas necesarias
                </h4>
                <p className="text-xs text-ink">
                  {selectedTutorial.tools.join(' · ')}
                </p>
              </div>

              {/* Safety Warnings */}
              <div className="p-3.5 rounded-xl bg-accent-soft border border-accent/50 space-y-1.5">
                <h4 className="text-xs font-semibold text-accent-strong flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-accent-strong shrink-0" />
                  <span>Advertencias de seguridad del procedimiento</span>
                </h4>
                <ul className="space-y-1 text-xs text-ink">
                  {selectedTutorial.safetyWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Interactive Checklist Steps */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-primary">
                  Pasos del procedimiento
                </h4>
                <div className="space-y-2">
                  {selectedTutorial.steps.map((step, idx) => {
                    const key = `${selectedTutorial.id}_${idx}`;
                    const checked = Boolean(completedSteps[key]);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setCompletedSteps((prev) => toggleChecklistStep(prev, key))
                        }
                        aria-pressed={checked}
                        className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                          checked
                            ? 'bg-primary-soft border-primary/60'
                            : 'bg-secondary/70 border-line hover:border-line-strong'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {checked ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted" />
                          )}
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-ink">
                            {idx + 1}. {step.title}
                          </span>
                          <span className="block text-xs text-ink mt-1 leading-relaxed">
                            {step.detail}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
