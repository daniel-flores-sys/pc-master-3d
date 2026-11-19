import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
  /** Si es false, Escape y el fondo no cierran el diálogo */
  dismissable?: boolean;
  labelledById?: string;
}

/** Diálogo accesible basado en <dialog> nativo (atrapa el foco y bloquea el fondo). */
export function Modal({ open, title, onClose, children, dismissable = true }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissable) onClose?.();
      }}
      onClick={(e) => {
        if (dismissable && e.target === ref.current) onClose?.();
      }}
      className="m-auto w-[min(34rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/55"
    >
      {open && <div className="p-6 sm:p-7">{children}</div>}
    </dialog>
  );
}
