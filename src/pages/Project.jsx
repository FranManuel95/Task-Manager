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
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

// 🧱 Componente de columna
function Columna({ id, titulo, tareas }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 p-4 rounded-xl min-h-[200px] shadow-inner"
    >
      <h2 className="text-lg font-semibold mb-4">{titulo}</h2>
      <div className="space-y-2">
        {tareas.map((tarea) => (
          <Tarea key={tarea.id} tarea={tarea} parent={id} />
        ))}
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
