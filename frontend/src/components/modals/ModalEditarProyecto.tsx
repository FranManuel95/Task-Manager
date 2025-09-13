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
      className="fixed inset-0 flex items-center justify-center bg-gray-100/70 z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl font-bold mb-4">
          Editar proyecto
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => onChangeNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={nuevaDescripcion}
              onChange={(e) => onChangeDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Color del proyecto
            </label>
            <input
              type="color"
              value={nuevoColor}
              onChange={(e) => onChangeColor(e.target.value)}
              className="w-16 h-10 cursor-pointer"
              aria-label="Color del proyecto"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Fecha de entrega
            </label>
            <input
              type="date"
              value={nuevoDeadline}
              onChange={(e) => onChangeDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
