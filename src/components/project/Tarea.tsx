import { useState, useRef, useCallback, ChangeEvent, KeyboardEvent } from "react";
import { motion } from "motion/react";
import { useDraggable } from "@dnd-kit/core";
import { parseISO, isBefore, differenceInHours } from "date-fns";

import { Estado, Tarea as TareaModel, Prioridad } from "../../types";

type Props = {
  proyectoId: string;
  tarea: TareaModel;
  parent: Estado;
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

export default function Tarea({
  proyectoId,
  tarea,
  parent,
  onEliminar,
  onEditar,
  proyectoDeadline,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tarea.id,
    data: { parent, tarea },
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState(tarea.titulo);
  const [nuevaDescripcion, setNuevaDescripcion] = useState(tarea.descripcion);
  const [prioridad, setPrioridad] = useState<Prioridad>(tarea.prioridad);
  const [deadline, setDeadline] = useState<string>(tarea.deadline ?? "");
  const [etiquetas, setEtiquetas] = useState<string[]>(tarea.etiquetas);
  const [etiquetaInput, setEtiquetaInput] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

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
        deadline || null,
        etiquetas
      );
    }
    setModoEdicion(false);
  }, [nuevoTitulo, nuevaDescripcion, prioridad, deadline, etiquetas, onEditar, proyectoId, parent, tarea.id]);

  const manejarKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      guardarCambios();
    }
  };

  const manejarEtiquetas = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && etiquetaInput.trim()) {
      e.preventDefault();
      setEtiquetas((prev) => [...prev, etiquetaInput.trim()]);
      setEtiquetaInput("");
    }
  };

  const warningDeadline = () => {
    if (!tarea.deadline) return null;
    const fecha = parseISO(tarea.deadline);
    const horasRestantes = differenceInHours(fecha, new Date());

    if (isBefore(fecha, new Date())) {
      return <span className="text-red-600 text-xs flex items-center gap-1">⏰ Vencida</span>;
    } else if (horasRestantes <= 24) {
      return <span className="text-orange-500 text-xs flex items-center gap-1">⏰ Próxima a vencer</span>;
    }
    return null;
  };

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      animate={{ opacity: isDragging ? 0 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white p-3 rounded-lg shadow transition flex flex-col gap-2"
    >
      {modoEdicion ? (
        <div ref={formRef} className="flex flex-col gap-2">
          <input
            value={nuevoTitulo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNuevoTitulo(e.target.value)}
            onKeyDown={manejarKeyDown}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            autoFocus
          />
          <textarea
            value={nuevaDescripcion}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNuevaDescripcion(e.target.value)}
            onKeyDown={manejarKeyDown}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            placeholder="Añade una descripción..."
          />
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value as Prioridad)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            aria-label="Prioridad"
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <input
            type="date"
            value={deadline}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)}
            max={proyectoDeadline ?? ""} /* <- ya no falla null vs undefined */
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
          <input
            type="text"
            value={etiquetaInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEtiquetaInput(e.target.value)}
            onKeyDown={manejarEtiquetas}
            placeholder="Etiquetas (Enter para añadir)"
            className="text-sm border border-gray-300 rounded px-2 py-1"
          />
          <div className="flex flex-wrap gap-1">
            {etiquetas.map((tag, i) => (
              <span key={i} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={guardarCambios} className="bg-green-600 text-white px-3 py-1 text-sm rounded">
              Guardar
            </button>
            <button onClick={() => setModoEdicion(false)} className="bg-gray-400 text-white px-3 py-1 text-sm rounded">
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
                className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                aria-label="Editar tarea"
                title="Editar"
              >
                ✎
              </button>
            </p>
            {tarea.descripcion && <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>}
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              Prioridad:{" "}
              <span
                className={`inline-block text-xs px-2 py-1 rounded font-medium ${
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
            {tarea.deadline && <p className="text-xs text-gray-500 mt-1">📅 {tarea.deadline}</p>}
            <div className="mt-1">{warningDeadline()}</div>
            {tarea.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tarea.etiquetas.map((etiqueta, i) => (
                  <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
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
              className="text-gray-400 hover:text-gray-600"
              title="Arrastrar"
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
              aria-label="Arrastrar tarea"
            >
              ⠿
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEliminar(proyectoId, parent, tarea.id);
              }}
              className="text-red-500 hover:text-red-700 text-sm"
              aria-label="Eliminar tarea"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
