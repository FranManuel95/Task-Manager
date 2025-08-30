import { useState, ChangeEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "motion/react";
import Tarea from "./Tarea";
import { TareaType, EstadoID, Prioridad, columnaColors } from "./constantes";

type Props = {
  id: EstadoID;
  titulo: string;
  tareas: TareaType[];
  proyectoId: string;
  onAgregar: (proyectoId: string, estado: EstadoID, titulo: string) => void;
  onEliminar: (proyectoId: string, estado: EstadoID, tareaId: string) => void;
  onEditar: (
    proyectoId: string,
    estado: EstadoID,
    tareaId: string,
    titulo: string,
    descripcion: string,
    prioridad: Prioridad,
    deadline: string | null,
    etiquetas: string[]
  ) => void;
  proyectoDeadline?: string;
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
    <div
      ref={setNodeRef}
      className={`p-4 rounded-xl min-h-[200px] shadow-inner transition-all border
        ${columnaColors[id] || "bg-gray-100"}
        ${isOver ? "border-2 border-blue-400" : "border-transparent"}
      `}
    >
      <h2 className="text-lg font-semibold mb-4">
        {titulo}{" "}
        <span className="text-sm text-gray-500">({tareas.length})</span>
      </h2>

      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {tareas.map((tarea) => (
            <Tarea
              key={tarea.id}
              proyectoId={proyectoId}
              tarea={tarea}
              parent={id}
              onEliminar={onEliminar}
              onEditar={onEditar}
              proyectoDeadline={proyectoDeadline}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={nuevaTarea}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNuevaTarea(e.target.value)
          }
          className="w-full px-2 py-1 rounded border border-gray-300 text-sm"
          placeholder="Nueva tarea..."
        />
        <button
          onClick={handleAgregar}
          className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
