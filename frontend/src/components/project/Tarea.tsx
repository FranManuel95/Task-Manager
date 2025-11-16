import { motion } from "motion/react";
import { useDraggable } from "@dnd-kit/core";
import { parseISO, isBefore, differenceInHours } from "date-fns";
import { useState } from "react";
import ModalConfirmacion from "../modals/ModalConfirmacion"; // nuevo modal reutilizable
import { Estado, Tarea as TareaModel } from "../../types";
import TaskModal from "../project/TaskModal";

type Props = {
  proyectoId: string;
  tarea: TareaModel;
  parent: Estado;
  onEliminar: (proyectoId: string, estado: Estado, tareaId: string) => void;
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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: tarea.id,
      data: { parent, tarea },
    });

  const [showDelete, setShowDelete] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

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
  const updatedAtLabel = tarea.updatedAt
    ? new Date(tarea.updatedAt).toLocaleString()
    : null;

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        animate={{ opacity: isDragging ? 0 : 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="theme-card p-3 rounded-lg shadow-card hover:shadow-hover transition-all duration-500 flex flex-col gap-2"
      >
        <div className="group flex  gap-2">
          {/* Drag handle */}
          <div
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            className="select-none h-5 flex items-center text-gray-400 transition hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            aria-label="Arrastrar tarea"
            title="Arrastrar"
          >
            ⠿
          </div>

          {/* Contenido */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              {/* Título -> abre visor de solo lectura */}
              <h4
                className="truncate text-sm font-medium leading-5 dark:text-neutral-50 cursor-pointer hover:underline decoration-dotted"
                title="Ver detalles"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewer(true);
                }}
              >
                {tarea.titulo}
              </h4>

              <div className="flex items-center gap-2">
                <span
                  className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    tarea.prioridad === "alta"
                      ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
                      : tarea.prioridad === "media"
                        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900"
                  }`}
                >
                  {tarea.prioridad}
                </span>

                {/* Botón editar eliminado: lo llevamos al visor */}
                {/* <button ...>✎</button> */}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDelete(true);
                  }}
                  className=" text-rose-500 hover:text-rose-700 hover:cursor-pointer"
                  aria-label="Eliminar tarea"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>

            {tarea.descripcion && (
              <p className="mt-1 text-xs text-gray-600 dark:text-neutral-300">
                {tarea.descripcion}
              </p>
            )}

            {/* Meta */}
            <div className="mt-2 grid gap-1 text-[11px] text-gray-500 dark:text-neutral-400">
              <div>
                <span className="text-gray-600 dark:text-neutral-300">
                  Creada por:
                </span>{" "}
                {creatorLabel}
              </div>
              <div>
                <span className="text-gray-600 dark:text-neutral-300">
                  Última modificación:
                </span>{" "}
                {updaterLabel}
                {updatedAtLabel ? ` — ${updatedAtLabel}` : ""}
              </div>
            </div>

            {/* Deadline + etiquetas */}
            <div className="mt-2 mb-3 flex flex-wrap items-center gap-2">
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
                  <span
                    key={i}
                    className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
                  >
                    #{etiqueta}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal eliminar */}
      {showDelete && (
        <ModalConfirmacion
          title="Eliminar tarea"
          description={`¿Seguro que deseas eliminar la tarea "${tarea.titulo}"?`}
          confirmLabel="Eliminar"
          onClose={() => setShowDelete(false)}
          onConfirm={() => {
            onEliminar(proyectoId, parent, tarea.id);
            setShowDelete(false);
          }}
        />
      )}

      {/* Visor de solo lectura */}
      {showViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setShowViewer(false)
          }
        >
          <div className="absolute inset-0  backdrop-blur-sm" />
          <div className="relative w-[min(560px,94vw)] rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Detalle de la tarea</h3>
              <button
                onClick={() => setShowViewer(false)}
                className="rounded-lg border border-[rgb(var(--color-border))] px-2 py-1 text-sm hover:bg-[rgb(var(--color-card))]/70 hover:cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3">
              {/* Fila principal: título + prioridad */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold dark:text-white break-words">
                    {tarea.titulo}
                  </div>
                  {tarea.descripcion && (
                    <p className="mt-1 text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap break-words">
                      {tarea.descripcion}
                    </p>
                  )}
                </div>
                <span
                  className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium self-start ${
                    tarea.prioridad === "alta"
                      ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
                      : tarea.prioridad === "media"
                        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900"
                  }`}
                >
                  {tarea.prioridad}
                </span>
              </div>

              {/* Estado / Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="text-gray-700 dark:text-neutral-300">
                  <span className="opacity-70">Columna:</span>{" "}
                  <span className="font-medium">
                    {parent === "por-hacer"
                      ? "Por hacer"
                      : parent === "en-progreso"
                        ? "En progreso"
                        : "Completado"}
                  </span>
                </div>
                <div className="text-gray-700 dark:text-neutral-300">
                  <span className="opacity-70">Fecha límite:</span>{" "}
                  <span className="font-medium">
                    {tarea.deadline ? formatDateOnly(tarea.deadline) : "—"}
                  </span>
                </div>
              </div>

              {/* Etiquetas */}
              {tarea.etiquetas.length > 0 && (
                <div className="text-sm">
                  <div className="opacity-70 mb-1">Etiquetas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tarea.etiquetas.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="grid gap-1 text-[12px] text-gray-600 dark:text-neutral-400">
                <div>
                  <span className="opacity-70">Creada por:</span> {creatorLabel}
                </div>
                <div>
                  <span className="opacity-70">Última modificación:</span>{" "}
                  {updaterLabel}
                  {updatedAtLabel ? ` — ${updatedAtLabel}` : ""}
                </div>
              </div>

              {/* Botonera */}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowViewer(false)}
                  className="rounded-lg border border-[rgb(var(--color-border))] px-4 py-2 text-sm hover:bg-[rgb(var(--color-card))]/70 hover:cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowViewer(false);
                    onEditRequest(tarea, parent); // 👈 abre tu modal de edición existente
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 hover:cursor-pointer"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewer && (
        <TaskModal
          variant="task"
          open={showViewer}
          mode="edit"
          readOnly
          onClose={() => setShowViewer(false)}
          proyectoDeadline={proyectoDeadline ?? null}
          initialValues={{
            estado: parent,
            titulo: tarea.titulo,
            descripcion: tarea.descripcion ?? "",
            prioridad: tarea.prioridad ?? "media",
            deadline: tarea.deadline ?? null,
            etiquetas: tarea.etiquetas ?? [],
          }}
          // en solo lectura no confirmamos nada
          onConfirm={() => {}}
          onEditClick={() => {
            setShowViewer(false);
            onEditRequest(tarea, parent); // reutilizas tu flujo de edición existente
          }}
        />
      )}
    </>
  );
}
