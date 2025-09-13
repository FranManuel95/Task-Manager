import { useEffect, useRef } from "react";

type Props = {
  onClose: () => void;
  onConfirm: () => void;
};

export default function ModalEliminarProyecto({ onClose, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "eliminar-proyecto-title";

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
        <h2 id={titleId} className="text-xl font-bold mb-4 text-red-600">
          Eliminar proyecto
        </h2>
        <p className="mb-4 text-gray-700">
          ¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
