// src/components/project/Columna.tsx
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "motion/react";
import Tarea from "./Tarea";
import { columnaColors } from "./constantes";
import { Estado, Tarea as TareaModel, Prioridad } from "../../types";

type Props = {
  id: Estado;
  titulo: string;
  tareas: TareaModel[];
  proyectoId: string;
  onEliminar: (proyectoId: string, estado: Estado, tareaId: string) => void;
  onEditar: (
    proyectoId: string,
    estado: Estado,
    tareaId: string,
    titulo: string,
    descripcion: string,
    prioridad: Prioridad,
    deadline: string | null,
    etiquetas: string[],
  ) => void;
  /** nuevo callback para abrir modal desde Project */
  onEditRequest: (tarea: TareaModel, parent: Estado) => void;
  proyectoDeadline?: string | null;
};

export default function Columna({
  id,
  titulo,
  tareas,
  proyectoId,
  onEliminar,
  onEditar,
  onEditRequest,
  proyectoDeadline,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={[
        "rounded-2xl theme-card shadow-card hover:shadow-hover transition-all duration-500",
        isOver
          ? "border-indigo-300 ring-4 ring-indigo-100 dark:ring-indigo-900/40"
          : "border-gray-200",
      ].join(" ")}
      aria-label={`Columna ${titulo}`}
    >
      <header
        className={[
          "flex items-center justify-between gap-3",
          "px-3 py-3 border-b",
          columnaColors[id] || "bg-gray-50 dark:bg-neutral-900/40",
          "border-gray-200 dark:border-neutral-800 rounded-t-2xl",
        ].join(" ")}
      >
        <h2 className="text-sm font-semibold tracking-tight">
          {titulo}
          <span className="ml-2 inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300">
            {tareas.length}
          </span>
        </h2>
      </header>

      <div className="min-h-[180px] space-y-2 p-3">
        <AnimatePresence>
          {tareas.map((tarea) => (
            <Tarea
              key={tarea.id}
              proyectoId={proyectoId}
              tarea={tarea}
              parent={id}
              onEliminar={onEliminar}
              onEditRequest={onEditRequest}
              proyectoDeadline={proyectoDeadline ?? null}
            />
          ))}
        </AnimatePresence>

        {tareas.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-neutral-500">
            Sin tareas aquí todavía
          </p>
        )}
      </div>
    </section>
  );
}
