import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { ComponentInfo } from '../types/hardware';
import { filterComponents } from '../utils/labLogic';

interface ComponentListDrawerProps {
  title: string;
  components: ComponentInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function ComponentListDrawer({
  title,
  components,
  selectedId,
  onSelect,
  onClose,
}: ComponentListDrawerProps) {
  const [query, setQuery] = useState('');
  const filtered = filterComponents(components, query);

  return (
    <div
      role="dialog"
      aria-label={`Lista de componentes de ${title}`}
      className="absolute top-14 left-3 z-30 w-80 max-w-[calc(100vw-24px)] max-h-[calc(100%-170px)] rounded-2xl bg-surface/95 border border-line-strong shadow-2xl flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-2">
        <div>
          <h3 className="font-serif font-semibold text-sm text-ink">
            Componentes ({components.length})
          </h3>
          <p className="text-xs text-muted">{title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar lista de componentes"
          className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-secondary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-line">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar componente..."
            aria-label="Buscar componente"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-secondary border border-line-strong text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">
            No se encontraron piezas con "{query}".
          </p>
        ) : (
          filtered.map((item) => {
            const isSel = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center justify-between gap-2 border cursor-pointer ${
                  isSel
                    ? 'bg-primary-soft border-primary/60 text-ink'
                    : 'bg-transparent border-transparent text-ink hover:bg-secondary hover:text-ink'
                }`}
              >
                <span className="text-xs font-medium truncate">{item.name}</span>
                <span className="text-xs text-muted shrink-0">
                  {item.category}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
