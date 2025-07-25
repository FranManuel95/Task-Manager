import { useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTareasStore } from "../store/tareasStore";

const estados = [
  { id: "por-hacer", titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado", titulo: "Completado" },
];

export default function Project() {
  const { id } = useParams();

  const tareas = useTareasStore((state) => state.tareas);
  const agregarTarea = useTareasStore((state) => state.agregarTarea);
  const eliminarTarea = useTareasStore((state) => state.eliminarTarea);
  const moverTarea = useTareasStore((state) => state.moverTarea);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const tareaId = active.id;
    const destino = over.id;

    if (destino === active.data.current?.parent) return;

    moverTarea(tareaId, destino);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Proyecto ID: {id}</h1>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estados.map((estado) => (
            <Columna
              key={estado.id}
              id={estado.id}
              titulo={estado.titulo}
              tareas={tareas[estado.id]}
              onAgregar={agregarTarea}
              onEliminar={eliminarTarea}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Columna({ id, titulo, tareas, onAgregar, onEliminar }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [nuevaTarea, setNuevaTarea] = useState("");

  const handleAgregar = () => {
    const tituloLimpiado = nuevaTarea.trim();
    if (!tituloLimpiado) return;

    onAgregar(id, tituloLimpiado);
    setNuevaTarea("");
  };

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-xl min-h-[200px] shadow-inner transition-all ${
        isOver ? "bg-blue-100 border-2 border-blue-400" : "bg-gray-100"
      }`}
    >
      <h2 className="text-lg font-semibold mb-4">{titulo}</h2>

      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {tareas.map((tarea) => (
            <Tarea key={tarea.id} tarea={tarea} parent={id} onEliminar={onEliminar} />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
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

function Tarea({ tarea, parent, onEliminar }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tarea.id,
    data: { parent },
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 10,
        position: "relative",
      }
    : {};

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      style={{
        ...style,
        opacity: 0,
        scale: 0.95,
      }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`bg-white p-3 rounded-lg shadow transition flex justify-between items-center ${
        isDragging ? "opacity-50" : "hover:bg-gray-50"
      }`}
    >
      <div {...listeners} className="flex-1 cursor-move">
        {tarea.titulo}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEliminar(parent, tarea.id);
        }}
        className="ml-2 text-sm text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </motion.div>
  );
}

