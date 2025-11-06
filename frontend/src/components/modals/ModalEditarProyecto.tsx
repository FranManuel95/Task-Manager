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

export default function ModalEditarProyecto({
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
  const titleId = "editar-proyecto-title";

  useEffect(() => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="theme-card w-full max-w-md rounded-2xl border border-[rgb(var(--color-border))] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="mb-4 text-xl font-bold text-[rgb(var(--color-fg))]">
          Editar proyecto
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Nombre
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => onChangeNombre(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] px-3 py-2
                         text-[rgb(var(--color-fg))] outline-none transition
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Descripción
            </label>
            <textarea
              value={nuevaDescripcion}
              onChange={(e) => onChangeDescripcion(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] px-3 py-2
                         text-[rgb(var(--color-fg))] outline-none transition
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600"
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Color del proyecto
            </label>
            <input
              type="color"
              value={nuevoColor}
              onChange={(e) => onChangeColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))]"
              aria-label="Color del proyecto"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--color-fg-muted))]">
              Fecha de entrega
            </label>
            <input
              type="date"
              value={nuevoDeadline}
              onChange={(e) => onChangeDeadline(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] px-3 py-2
                         text-[rgb(var(--color-fg))] outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] px-4 py-2 text-[rgb(var(--color-fg))]
                         hover:bg-[rgb(var(--color-card))]/80 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
