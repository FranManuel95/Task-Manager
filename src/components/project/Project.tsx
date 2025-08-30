import {
  DndContext,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useState, ChangeEvent } from "react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { useProyectoActual } from "../../hooks/useProyectoActual";
import Columna from "./Columna";
import { estados, TareaType, EstadoID, Prioridad } from "./constantes";

const ordenPrioridad: Record<Prioridad, number> = {
  alta: 1,
  media: 2,
  baja: 3,
};

export default function Project() {
  const {
    proyectoId,
    proyecto,
    agregarTarea,
    eliminarTarea,
    moverTarea,
    editarTarea,
    searchTerm,
    filterPrioridad,
    setSearchTerm,
    setFilterPrioridad,
    proyectoDeadline,
  } = useProyectoActual();

  const [activeTarea, setActiveTarea] = useState<TareaType | null>(null);

  if (!proyecto) {
    return <p className="p-6 text-red-600">Proyecto no encontrado</p>;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTarea(event.active.data.current?.tarea ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTarea(null);
    if (!over || !proyectoId) return;

    const tareaId = active.id as string;
    const destino = over.id as EstadoID;
    const origen = active.data.current?.parent as EstadoID;

    if (destino === origen) return;

    moverTarea(proyectoId, tareaId, destino);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Proyecto: {proyecto.nombre}</h1>
      <p className="mb-6 text-gray-600">{proyecto.descripcion}</p>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded"
        />
        <select
          value={filterPrioridad}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setFilterPrioridad(e.target.value as Prioridad | "todas")
          }
          className="w-full sm:w-1/4 px-3 py-2 border border-gray-300 rounded"
        >
          <option value="todas">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectoId &&
            estados.map((estado) => {
              const tareasFiltradas = proyecto.tareas[estado.id]
                .filter(
                  (t) =>
                    t.titulo
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) &&
                    (filterPrioridad === "todas" ||
                      t.prioridad === filterPrioridad)
                )
                .sort((a, b) => {
                  const aOrden = ordenPrioridad[a.prioridad ?? "media"];
                  const bOrden = ordenPrioridad[b.prioridad ?? "media"];
                  if (aOrden !== bOrden) return aOrden - bOrden;

                  // Ordenar por deadline si existe
                  if (a.deadline && b.deadline) {
                    return (
                      new Date(a.deadline).getTime() -
                      new Date(b.deadline).getTime()
                    );
                  }
                  if (a.deadline) return -1;
                  if (b.deadline) return 1;
                  return 0;
                });

              return (
                <Columna
                  key={estado.id}
                  id={estado.id}
                  titulo={estado.titulo}
                  tareas={tareasFiltradas}
                  proyectoId={proyectoId}
                  onAgregar={agregarTarea}
                  onEliminar={eliminarTarea}
                  onEditar={editarTarea}
                  proyectoDeadline={proyectoDeadline}
                />
              );
            })}
        </div>

        {/* Overlay al arrastrar */}
        {createPortal(
          <DragOverlay>
            {activeTarea && (
              <motion.div className="bg-white shadow-xl rounded-lg p-3">
                <p className="font-medium">{activeTarea.titulo}</p>
              </motion.div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}
