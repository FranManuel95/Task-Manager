import { useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useState } from "react";

// Tareas iniciales simuladas
const tareasIniciales = {
  "por-hacer": [
    { id: "t1", titulo: "Diseñar el logo" },
    { id: "t2", titulo: "Crear wireframes" },
  ],
  "en-progreso": [
    { id: "t3", titulo: "Implementar login" },
  ],
  "completado": [
    { id: "t4", titulo: "Configurar Tailwind" },
  ],
};

// Columnas
const estados = [
  { id: "por-hacer", titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado", titulo: "Completado" },
];

export default function Project() {
  const { id } = useParams();
  const [tareas, setTareas] = useState(tareasIniciales);

  // Mover tarea cuando se suelta
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const tareaId = active.id;
    const destino = over.id;

    if (destino === active.data.current?.parent) return; // misma columna

    // Remover de la columna original
    const nuevaTareas = { ...tareas };
    let tareaMovida;

    for (const estado in nuevaTareas) {
      nuevaTareas[estado] = nuevaTareas[estado].filter((t) => {
        if (t.id === tareaId) {
          tareaMovida = t;
          return false;
        }
        return true;
      });
    }

    // Agregar a la nueva columna
    nuevaTareas[destino].push(tareaMovida);
    setTareas(nuevaTareas);
  };
  
  const handleAgregarTarea = (estadoId, titulo) => {
    const nuevaTarea = {
      id: `t${Date.now()}`, // id único temporal
      titulo,
    };
  
    setTareas((prev) => ({
      ...prev,
      [estadoId]: [...prev[estadoId], nuevaTarea],
    }));
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
              onAgregar={handleAgregarTarea}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

// 🧱 Componente de columna
function Columna({ id, titulo, tareas, onAgregar }) {
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
        className={`p-4 rounded-xl min-h-[200px] shadow-inner transition-all
          ${isOver ? "bg-blue-100 border-2 border-blue-400" : "bg-gray-100"}
        `}
      >
        <h2 className="text-lg font-semibold mb-4">{titulo}</h2>
  
        <div className="space-y-2 mb-4">
          {tareas.map((tarea) => (
            <Tarea key={tarea.id} tarea={tarea} parent={id} />
          ))}
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
  

  

// 🗂️ Componente de tarea
function Tarea({ tarea, parent }) {
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
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`bg-white p-3 rounded-lg shadow transition ${
        isDragging ? "opacity-50" : "hover:bg-gray-50"
      }`}
    >
      {tarea.titulo}
    </div>
  );
}
