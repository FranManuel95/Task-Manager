import {
  DndContext,
  closestCenter,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { differenceInHours, parseISO, isBefore } from "date-fns";
import { useProyectoActual } from "../hooks/useProyectoActual"; // Hook centralizado

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
    proyectoDeadline
  } = useProyectoActual();

  const [activeTarea, setActiveTarea] = useState(null);

  if (!proyecto) {
    return <p className="p-6 text-red-600">Proyecto no encontrado</p>;
  }

  const handleDragStart = (event) => {
    setActiveTarea(event.active.data.current?.tarea || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTarea(null);
    if (!over) return;

    const tareaId = active.id;
    const destino = over.id;
    if (destino === active.data.current?.parent) return;

    moverTarea(proyectoId, tareaId, destino);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Proyecto: {proyecto.nombre}</h1>
      <p className="mb-6 text-gray-600">{proyecto.descripcion}</p>

      {/* Buscador y filtros */}
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

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estados.map((estado) => {
            const tareasFiltradas = (proyecto.tareas[estado.id] || [])
              .filter(
                (t) =>
                  (t?.titulo ?? "")
                    .toLowerCase()
                    .includes((searchTerm ?? "").toLowerCase()) &&
                  (filterPrioridad === "todas" ||
                    t?.prioridad === filterPrioridad)
              )
              .sort((a, b) => {
                const prioridadOrden = { alta: 1, media: 2, baja: 3 };
                const prioridadA = prioridadOrden[a.prioridad] || 4;
                const prioridadB = prioridadOrden[b.prioridad] || 4;

                if (prioridadA !== prioridadB) return prioridadA - prioridadB;
                if (a.deadline && b.deadline)
                  return new Date(a.deadline) - new Date(b.deadline);
                if (a.deadline) return -1;
                if (b.deadline) return 1;
                return 0;
              });

            return (
              <Columna
                key={estado.id}
                proyectoId={proyectoId}
                id={estado.id}
                titulo={estado.titulo}
                tareas={tareasFiltradas}
                onAgregar={agregarTarea}
                proyectoDeadline={proyectoDeadline}
                onEliminar={eliminarTarea}
                onEditar={editarTarea} // 👈 pasamos editar también
              />
            );
          })}
        </div>

        {createPortal(
          <DragOverlay>
            {activeTarea ? (
              <motion.div
                className="bg-white shadow-xl rounded-lg p-3"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1.05, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-medium">{activeTarea.titulo}</p>
              </motion.div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}

function Columna({ proyectoId, id, titulo, tareas, onAgregar, onEliminar, onEditar }) {
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
        {titulo} <span className="text-sm text-gray-500">({tareas.length})</span>
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
              onEditar={onEditar} // 👈 lo pasamos aquí
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

function Tarea({ proyectoId, tarea, parent, onEliminar, onEditar, proyectoDeadline }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tarea.id, data: { parent, tarea } });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState(tarea.titulo);
  const [nuevaDescripcion, setNuevaDescripcion] = useState(tarea.descripcion || "");
  const [prioridad, setPrioridad] = useState(tarea.prioridad || "media");
  const [deadline, setDeadline] = useState(tarea.deadline || "");
  const [etiquetas, setEtiquetas] = useState(tarea.etiquetas || []);
  const [etiquetaInput, setEtiquetaInput] = useState("");

  const formRef = useRef(null);

  const guardarCambios = useCallback(() => {
    const tituloLimpio = nuevoTitulo.trim();
    const descripcionLimpia = nuevaDescripcion.trim();
    if (tituloLimpio) {
      onEditar(
        proyectoId,
        parent,
        tarea.id,
        tituloLimpio,
        descripcionLimpia,
        prioridad,
        deadline,
        etiquetas
      );
    }
    setModoEdicion(false);
  }, [
    nuevoTitulo,
    nuevaDescripcion,
    prioridad,
    deadline,
    etiquetas,
    onEditar,
    parent,
    tarea.id,
    proyectoId,
  ]);

  const manejarKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      guardarCambios();
    }
  };

  const manejarEtiquetas = (e) => {
    if (e.key === "Enter" && etiquetaInput.trim()) {
      e.preventDefault();
      setEtiquetas((prev) => [...prev, etiquetaInput.trim()]);
      setEtiquetaInput("");
    }
  };

  let deadlineWarning = null;
  if (tarea.deadline) {
    const deadlineDate = parseISO(tarea.deadline);
    const horasRestantes = differenceInHours(deadlineDate, new Date());

    if (isBefore(deadlineDate, new Date())) {
      deadlineWarning = (
        <span className="text-red-600 text-xs flex items-center gap-1">
          ⏰ Vencida
        </span>
      );
    } else if (horasRestantes <= 24) {
      deadlineWarning = (
        <span className="text-orange-500 text-xs flex items-center gap-1">
          ⏰ Próxima a vencer
        </span>
      );
    }
  }

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
      style={style}
      layout={false}
      animate={{
        opacity: isDragging ? 0 : 1,
        scale: 1,
        boxShadow: isDragging
          ? "0px 8px 20px rgba(0,0,0,0.2)"
          : "0px 2px 5px rgba(0,0,0,0.1)",
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className="bg-white p-3 rounded-lg shadow transition flex flex-col gap-2"
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

          <label className="text-sm text-gray-600">
            Fecha límite:
            <input
  type="date"
  value={deadline}
  onChange={(e) => setDeadline(e.target.value)}
  max={proyectoDeadline || ""} // límite de fecha según el proyecto
  className="text-sm border border-gray-300 rounded px-2 py-1 mt-1 block"
/>
          </label>

          <input
            type="text"
            value={etiquetaInput}
            onChange={(e) => setEtiquetaInput(e.target.value)}
            onKeyDown={manejarEtiquetas}
            placeholder="Etiquetas (Enter para añadir)"
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />

          <div className="flex flex-wrap gap-1">
            {etiquetas.map((tag, i) => (
              <span
                key={i}
                className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={guardarCambios}
              className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
            >
              Guardar
            </button>
            <button
              onClick={() => setModoEdicion(false)}
              className="bg-gray-400 text-white px-3 py-1 text-sm rounded hover:bg-gray-500"
            >
              Cancelar
            </button>
          </div>
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
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              Prioridad:{" "}
              <span
                className={`inline-block text-xs px-2 py-1 rounded font-medium
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
            </p>
            {tarea.deadline && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                Fecha límite: {tarea.deadline}
              </p>
            )}
            <div className="gap-2 mt-2 mb-2">{deadlineWarning}</div>
            {tarea.etiquetas?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tarea.etiquetas.map((etiqueta, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded"
                  >
                    #{etiqueta}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 items-start">
            <div
              {...listeners}
              {...attributes}
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
              className="text-gray-400 hover:text-gray-600"
              title="Arrastrar"
            >
              ⠿
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEliminar(proyectoId, parent, tarea.id);
              }}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
