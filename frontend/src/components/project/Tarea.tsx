// src/components/project/Tarea.tsx
import { motion } from "motion/react";
import { useDraggable } from "@dnd-kit/core";
import { parseISO, isBefore, differenceInHours } from "date-fns";
import { Estado, Tarea as TareaModel, Prioridad } from "../../types";

type Props = {
  proyectoId: string;
  tarea: TareaModel;
  parent: Estado;
  onEliminar: (proyectoId: string, estado: Estado, tareaId: string) => void;
  /** en lugar de modoEdicion inline, pedimos al padre abrir el modal */
  onEditRequest: (tarea: TareaModel, parent: Estado) => void;
  proyectoDeadline?: string | null;
};

function formatDateOnly(value: string): string {
  try {
    const d = value.length > 10 ? parseISO(value) : new Date(value);
    return d.toLocaleDateString();
  } catch {
    return value;
  }
}

export default function Tarea({
  proyectoId,
  tarea,
  parent,
  onEliminar,
  onEditRequest,
  proyectoDeadline,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tarea.id,
    data: { parent, tarea },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 }
    : undefined;

  const warningDeadline = () => {
    if (!tarea.deadline) return null;
    const fecha = parseISO(tarea.deadline);
    const horasRestantes = differenceInHours(fecha, new Date());

    if (isBefore(fecha, new Date())) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          ⏰ Vencida
        </span>
      );
    } else if (horasRestantes <= 24) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          ⏰ Próxima a vencer
        </span>
      );
    }
    return null;
  };

  const creatorLabel = tarea.createdByName || tarea.createdBy || "—";
  const updaterLabel = tarea.updatedByName || tarea.updatedBy || "—";
  const updatedAtLabel = tarea.updatedAt ? new Date(tarea.updatedAt).toLocaleString() : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      animate={{ opacity: isDragging ? 0 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="theme-card p-3 rounded-lg shadow-card hover:shadow-hover transition-all duration-500 flex flex-col gap-2"
    >
      <div className="group flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 select-none text-gray-400 transition hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          aria-label="Arrastrar tarea"
          title="Arrastrar"
        >
          ⠿
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-medium dark:text-neutral-50">
              {tarea.titulo}
            </h4>

            <div className="flex items-center gap-2">
              <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                tarea.prioridad === "alta"
                  ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
                  : tarea.prioridad === "media"
                  ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
                  : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900"
              }`}>
                {tarea.prioridad}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRequest(tarea, parent);
                }}
                className="opacity-0 transition group-hover:opacity-100 text-gray-400 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                aria-label="Editar tarea"
                title="Editar"
              >
                ✎
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminar(proyectoId, parent, tarea.id);
                }}
                className="opacity-0 transition group-hover:opacity-100 text-rose-500 hover:text-rose-700"
                aria-label="Eliminar tarea"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          </div>

          {tarea.descripcion && (
            <p className="text-xs text-gray-600 dark:text-neutral-300">{tarea.descripcion}</p>
          )}

          {/* Meta */}
          <div className="mt-2 grid gap-1 text-[11px] text-gray-500 dark:text-neutral-400">
            <div>
              <span className="text-gray-600 dark:text-neutral-300">Creada por:</span> {creatorLabel}
            </div>
            <div>
              <span className="text-gray-600 dark:text-neutral-300">Última modificación:</span> {updaterLabel}
              {updatedAtLabel ? ` — ${updatedAtLabel}` : ""}
            </div>
          </div>

          {/* Deadline + etiquetas */}
          <div className="mt-1 mb-3 flex flex-wrap items-center gap-2">
            {tarea.deadline && (
              <span className="inline-flex items-center bg-gray-50 text-[11px] text-gray-700  dark:bg-neutral-800 dark:text-neutral-200">
                📅 {formatDateOnly(tarea.deadline)}
              </span>
            )}
            {warningDeadline()}
          </div>

          {tarea.etiquetas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tarea.etiquetas.map((etiqueta, i) => (
                <span key={i} className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                  #{etiqueta}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
