import {
  DndContext,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { ChangeEvent, useState } from "react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";

import { useProyectoActual } from "../../hooks/useProyectoActual";
import Columna from "./Columna";
import { ordenPrioridad, estados } from "./constantes"; // asegúrate: estados: { id: Estado; titulo: string }[]
import { Estado, Tarea, Prioridad } from "../../types"; // ← unificado
import { useTareasStore } from "../../store/tareasStore";
import ChatPanel from "./ChatPanel";


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

  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null);
  const [emailNuevo, setEmailNuevo] = useState<string>("");

  const agregarColaborador = useTareasStore((state) => state.agregarColaborador);

  const handleAgregar = () => {
    const email = emailNuevo.trim();
    if (!email) return;
    // opcional: validar formato
    // if (!/^\S+@\S+\.\S+$/.test(email)) return alert("Email no válido");
    if (proyectoId) {
      agregarColaborador(proyectoId, email);
      setEmailNuevo("");
    }
  };

  if (!proyecto) {
    return <p className="p-6 text-red-600">Proyecto no encontrado</p>;
  }

  const handleDragStart = (event: DragStartEvent) => {
    // dnd-kit: suele pasarse en data.current algo como { tarea, parent }
    setActiveTarea(event.active.data.current?.tarea ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTarea(null);
    if (!over || !proyectoId) return;

    const tareaId = active.id as string;
    const destino = over.id as Estado;
    const origen = active.data.current?.parent as Estado;

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
                    t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    (filterPrioridad === "todas" || t.prioridad === filterPrioridad)
                )
                .sort((a, b) => {
                  // 1) ordenar por prioridad
                  const aOrden = ordenPrioridad[a.prioridad];
                  const bOrden = ordenPrioridad[b.prioridad];
                  if (aOrden !== bOrden) return aOrden - bOrden;

                  // 2) ordenar por deadline (las más próximas primero)
                  if (a.deadline && b.deadline) {
                    return (
                      new Date(a.deadline).getTime() -
                      new Date(b.deadline).getTime()
                    );
                  }
                  if (a.deadline) return -1; // a tiene fecha, va antes
                  if (b.deadline) return 1;  // b tiene fecha, va antes
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

      {/* Invitar colaborador */}
      <div className="mt-4">
        <h3 className="font-semibold text-sm mb-2">Invitar colaborador</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailNuevo}
            onChange={(e) => setEmailNuevo(e.target.value)}
            placeholder="Correo del colaborador"
            className="border px-2 py-1 rounded w-full"
          />
          <button
            onClick={handleAgregar}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Añadir
          </button>
        </div>
      </div>
      {proyectoId && (
  <ChatPanel proyectoId={proyectoId} />
)}

    </div>
  );
}
