// src/components/common/ModalConfirmacion.tsx
import { useEffect, useRef } from "react";

type Props = {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
};

export default function ModalConfirmacion({
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Eliminar",
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "confirm-dialog-title";

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
      className="bg-black/60 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center px-4"
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
        <h2
          id={titleId}
          className="mb-3 text-xl font-bold text-red-600 dark:text-red-400"
        >
          {title}
        </h2>

        <p className="mb-5 text-sm text-gray-700 dark:text-gray-300">
          {description}{" "}
          <span className="font-medium text-red-600 dark:text-red-400">
            Esta acción no se puede deshacer.
          </span>
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[rgb(var(--color-border))]
                       bg-[rgb(var(--color-card))] px-4 py-2 text-[rgb(var(--color-fg))] transition
                       hover:bg-[rgb(var(--color-card))]/80 hover:cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 hover:cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
