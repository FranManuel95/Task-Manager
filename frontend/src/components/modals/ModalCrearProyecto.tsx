import { FormEvent, useEffect, useRef } from "react";

type Props = {
  nuevoNombre: string;
  nuevaDescripcion: string;
  nuevoColor: string;
  nuevoDeadline: string;
  onChangeNombre: (val: string) => void;
  onChangeDescripcion: (val: string) => void;
  onChangeColor: (val: string) => void;
  onChangeDeadline: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
};

export default function ModalCrearProyecto({
  nuevoNombre,
  nuevaDescripcion,
  nuevoColor,
  nuevoDeadline,
  onChangeNombre,
  onChangeDescripcion,
  onChangeColor,
  onChangeDeadline,
  onClose,
  onSubmit,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "crear-proyecto-title";
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    // Bloquea scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="theme-card rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[rgb(var(--color-border))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-xl font-semibold mb-4 text-[rgb(var(--color-fg))]"
        >
          Crear nuevo proyecto
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Nombre del proyecto"
              value={nuevoNombre}
              onChange={(e) => onChangeNombre(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         outline-none transition"
              required
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Descripción
            </label>
            <textarea
              placeholder="Descripción (opcional)"
              value={nuevaDescripcion}
              onChange={(e) => onChangeDescripcion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         outline-none transition"
            />
          </div>

          {/* Color */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Color del proyecto
            </label>
            <input
              type="color"
              value={nuevoColor}
              onChange={(e) => onChangeColor(e.target.value)}
              className="w-16 h-10 cursor-pointer rounded border border-[rgb(var(--color-border))] bg-transparent"
              aria-label="Color del proyecto"
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Fecha de entrega
            </label>
            <input
              type="date"
              value={nuevoDeadline}
              min={today}
              onChange={(e) => onChangeDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         outline-none transition"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         hover:bg-[rgb(var(--color-card))]/80 focus:outline-none
                         focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600
                         transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg  text-white font-medium
                         focus:outline-none focus:ring-2
                         focus:ring-indigo-400 bg-indigo-600 hover:bg-indigo-500
                         transition"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
