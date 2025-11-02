import { useState, ChangeEvent } from "react";
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
  onAgregar: (proyectoId: string, estado: Estado, titulo: string) => void;
  onEliminar: (proyectoId: string, estado: Estado, tareaId: string) => void;
  onEditar: (
    proyectoId: string,
    estado: Estado,
    tareaId: string,
    titulo: string,
    descripcion: string,
    prioridad: Prioridad,
    deadline: string | null,
    etiquetas: string[]
  ) => void;
  proyectoDeadline?: string | null;
};

export default function Columna({
  id,
  titulo,
  tareas,
  proyectoId,
  onAgregar,
  onEliminar,
  onEditar,
  proyectoDeadline,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [nuevaTarea, setNuevaTarea] = useState("");

  const handleAgregar = () => {
    const tituloLimpio = nuevaTarea.trim();
    if (!tituloLimpio) return;
    onAgregar(proyectoId, id, tituloLimpio);
    setNuevaTarea("");
  };

  return (
    <section
      ref={setNodeRef}
      className={[
        "rounded-2xl theme-card shadow-card hover:shadow-hover transition-all duration-500"
,
        isOver
          ? "border-indigo-300 ring-4 ring-indigo-100 dark:ring-indigo-900/40"
          : "border-gray-200",
      ].join(" ")}
      aria-label={`Columna ${titulo}`}
    >
      {/* Header */}
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

      {/* Lista de tareas */}
      <div className="p-3 space-y-2 min-h-[180px]">
        <AnimatePresence>
          {tareas.map((tarea) => (
            <Tarea
              key={tarea.id}
              proyectoId={proyectoId}
              tarea={tarea}
              parent={id}
              onEliminar={onEliminar}
              onEditar={onEditar}
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

      {/* Añadir nueva tarea */}
      <div className="px-3 pb-3">
        <div className="flex items-start gap-2">
          <label className="sr-only" htmlFor={`new-task-${id}`}>Nueva tarea</label>
          <input
            id={`new-task-${id}`}
            type="text"
            value={nuevaTarea}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNuevaTarea(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-900/40"
            placeholder="Añadir tarea…"
            onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
            aria-label={`Añadir tarea a ${titulo}`}
          />
          <button
            onClick={handleAgregar}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-indigo-900/50"
            disabled={!nuevaTarea.trim()}
          >
            Agregar
          </button>
        </div>
      </div>
    </section>
  );
}
