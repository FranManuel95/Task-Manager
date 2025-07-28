import { useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTareasStore } from "../store/tareasStore";

const estados = [
  { id: "por-hacer", titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado", titulo: "Completado" },
];

const columnaColors = {
  "por-hacer": "bg-yellow-100",
  "en-progreso": "bg-blue-100",
  "completado": "bg-green-100",
};

export default function Project() {
  const { id } = useParams();

  const tareas = useTareasStore((state) => state.tareas);
  const agregarTarea = useTareasStore((state) => state.agregarTarea);
  const eliminarTarea = useTareasStore((state) => state.eliminarTarea);
  const moverTarea = useTareasStore((state) => state.moverTarea);

  // filtros persistentes desde Zustand
  const searchTerm = useTareasStore((state) => state.searchTerm);
  const filterPrioridad = useTareasStore((state) => state.filterPrioridad);
  const setSearchTerm = useTareasStore((state) => state.setSearchTerm);
  const setFilterPrioridad = useTareasStore((state) => state.setFilterPrioridad);

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

      {/* 🔍 Barra de búsqueda y filtro persistentes */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded"
        />
        <select
          value={filterPrioridad}
          onChange={(e) => setFilterPrioridad(e.target.value)}
          className="w-full sm:w-1/4 px-3 py-2 border border-gray-300 rounded"
        >
          <option value="todas">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estados.map((estado) => {
            const tareasFiltradas = tareas[estado.id].filter(
              (t) =>
                t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (filterPrioridad === "todas" || t.prioridad === filterPrioridad)
            );

            return (
              <Columna
                key={estado.id}
                id={estado.id}
                titulo={estado.titulo}
                tareas={tareasFiltradas}
                onAgregar={agregarTarea}
                onEliminar={eliminarTarea}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}


function Columna({ id, titulo, tareas, onAgregar, onEliminar }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [nuevaTarea, setNuevaTarea] = useState("");

  const handleAgregar = () => {
    const tituloLimpio = nuevaTarea.trim();
    if (!tituloLimpio) return;

    onAgregar(id, tituloLimpio);
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
        {titulo} <span className="text-sm text-gray-500">({tareas.length})</span>
      </h2>

      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {tareas.map((tarea) => (
            <Tarea
              key={tarea.id}
              tarea={tarea}
              parent={id}
              onEliminar={onEliminar}
            />
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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tarea.id, data: { parent } });

  const editarTarea = useTareasStore((state) => state.editarTarea);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState(tarea.titulo);
  const [nuevaDescripcion, setNuevaDescripcion] = useState(tarea.descripcion || "");
  const [prioridad, setPrioridad] = useState(tarea.prioridad || "media");

  const formRef = useRef(null);

  const guardarCambios = useCallback(() => {
    const tituloLimpio = nuevoTitulo.trim();
    const descripcionLimpia = nuevaDescripcion.trim();
    if (tituloLimpio) {
      editarTarea(parent, tarea.id, tituloLimpio, descripcionLimpia, prioridad);
    }
    setModoEdicion(false);
  }, [nuevoTitulo, nuevaDescripcion, prioridad, editarTarea, parent, tarea.id]);

  const manejarKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      guardarCambios();
    }
  };

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10, position: "relative" }
    : {};

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      animate={{ opacity: 1, scale: 1 }}
      initial={{ opacity: 0, scale: 0.95 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`bg-white p-3 rounded-lg shadow transition flex flex-col gap-2 ${
        isDragging ? "opacity-50" : "hover:bg-gray-50"
      }`}
    >
      {modoEdicion ? (
        <div ref={formRef} className="flex flex-col gap-2">
          <input
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            onKeyDown={manejarKeyDown}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            autoFocus
          />
          <textarea
            value={nuevaDescripcion}
            onChange={(e) => setNuevaDescripcion(e.target.value)}
            onKeyDown={manejarKeyDown}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            placeholder="Añade una descripción..."
          />
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            onKeyDown={manejarKeyDown}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      ) : (
        <div className="flex justify-between items-start group">
          <div className="flex-1">
            <p className="font-medium flex items-center gap-2">
              {tarea.titulo}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModoEdicion(true);
                }}
                className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
                title="Editar tarea"
              >
                ✎
              </button>
            </p>
            {tarea.descripcion && (
              <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>
            )}
            {tarea.prioridad && (
              <span
                className={`inline-block mt-1 text-xs px-2 py-1 rounded font-medium
                  ${
                    tarea.prioridad === "alta"
                      ? "bg-red-100 text-red-700"
                      : tarea.prioridad === "media"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
              >
                {tarea.prioridad}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEliminar(parent, tarea.id);
            }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ✕
          </button>
        </div>
      )}
    </motion.div>
  );
}
