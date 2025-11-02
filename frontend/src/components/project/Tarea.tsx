import { useState, useRef, useCallback, ChangeEvent, KeyboardEvent } from "react";
import { motion } from "motion/react";
import { useDraggable } from "@dnd-kit/core";
import { parseISO, isBefore, differenceInHours } from "date-fns";
import { toast } from "sonner"; // 👈 toast como en el login

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

function formatDateOnly(value: string): string {
  try {
    const d = value.length > 10 ? parseISO(value) : new Date(value);
    return d.toLocaleDateString();
  } catch {
    return value;
  }
}

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

  // 👇 estado de error para el input de fecha
  const [deadlineError, setDeadlineError] = useState<string>("");

  const formRef = useRef<HTMLDivElement>(null);

  const guardarCambios = useCallback(() => {
    const tituloLimpio = nuevoTitulo.trim();
    const descripcionLimpia = nuevaDescripcion.trim();

    // Resetear error antes de validar
    setDeadlineError("");

    // ❗ Validar límite contra el deadline del proyecto (cliente)
    if (deadline && proyectoDeadline) {
      const dTask = new Date(deadline);
      const dProj = new Date(proyectoDeadline);
      if (dTask.getTime() > dProj.getTime()) {
        // En vez de alert, mostramos toast como en login
        toast.error("El deadline de la tarea no puede superar el del proyecto.");
        setDeadlineError("No puede ser posterior al deadline del proyecto.");
        return;
      }
    }

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
      toast.success("Tarea actualizada"); // feedback agradable
    }
    setModoEdicion(false);
  }, [
    nuevoTitulo,
    nuevaDescripcion,
    prioridad,
    deadline,
    etiquetas,
    onEditar,
    proyectoId,
    parent,
    tarea.id,
    proyectoDeadline,
  ]);

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
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          ⏰ Vencida
        </span>
      );
    } else if (horasRestantes <= 24) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          ⏰ Próxima a vencer
        </span>
      );
    }
    return null;
  };

  // helpers autoría/fecha
  const creatorLabel = tarea.createdByName || tarea.createdBy || "—";
  const updaterLabel = tarea.updatedByName || tarea.updatedBy || "—";
  const updatedAtLabel = tarea.updatedAt ? new Date(tarea.updatedAt).toLocaleString() : null;

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 }
    : undefined;

  const prioridadClass =
    prioridad === "alta"
      ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
      : prioridad === "media"
      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
      : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      animate={{ opacity: isDragging ? 0 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="theme-card p-3 rounded-lg shadow-card hover:shadow-hover transition-all duration-500 flex flex-col gap-2"
    >
      {modoEdicion ? (
        <div ref={formRef} className="flex flex-col gap-2">
          <input
            value={nuevoTitulo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNuevoTitulo(e.target.value)}
            onKeyDown={manejarKeyDown}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-900/40"
            autoFocus
            placeholder="Título"
          />
          <textarea
            value={nuevaDescripcion}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNuevaDescripcion(e.target.value)}
            onKeyDown={manejarKeyDown}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-900/40"
            placeholder="Añade una descripción…"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:ring-indigo-900/40"
              aria-label="Prioridad"
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
            <div>
              <input
                type="date"
                value={deadline}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setDeadline(e.target.value);
                  // al cambiar, limpiamos error visual
                  if (deadlineError) setDeadlineError("");
                }}
                max={proyectoDeadline ?? ""}
                aria-invalid={!!deadlineError}
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-4",
                  deadlineError
                    ? "border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/40"
                    : "border-gray-300 focus:border-indigo-300 focus:ring-indigo-100 dark:border-neutral-700 dark:focus:ring-indigo-900/40",
                  "dark:bg-neutral-800 dark:text-neutral-100",
                ].join(" ")}
              />
              {deadlineError && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {deadlineError}
                </p>
              )}
            </div>
          </div>

          <div>
            <input
              type="text"
              value={etiquetaInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEtiquetaInput(e.target.value)}
              onKeyDown={manejarEtiquetas}
              placeholder="Etiqueta · Enter para añadir"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-900/40"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {etiquetas.map((tag, i) => (
                <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-neutral-800 dark:text-neutral-200">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-1 flex gap-2">
            <button
              onClick={guardarCambios}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900/50"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setModoEdicion(false);
                setDeadlineError("");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus:ring-neutral-800/60"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex items-start gap-2">
          {/* Drag handle + acciones */}
          <div
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 select-none text-gray-400 transition hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            aria-label="Arrastrar tarea"
            title="Arrastrar"
          >
            ⠿
          </div>

          {/* Contenido */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h4 className="truncate text-sm font-medium">{tarea.titulo}</h4>

              <div className="flex items-center gap-2">
                <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  prioridad === "alta"
                    ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
                    : prioridad === "media"
                    ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900"
                }`}>
                  {tarea.prioridad}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModoEdicion(true);
                  }}
                  className="opacity-0 transition group-hover:opacity-100 text-gray-400 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  aria-label="Editar tarea"
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEliminar(proyectoId, parent, tarea.id);
                  }}
                  className="opacity-0 transition group-hover:opacity-100 text-rose-500 hover:text-rose-700"
                  aria-label="Eliminar tarea"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>

            {tarea.descripcion && (
              <p className="text-xs text-gray-600 dark:text-neutral-300">{tarea.descripcion}</p>
            )}

            {/* Meta */}
            <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-gray-500 dark:text-neutral-400 sm:grid-cols-2">
              <div><span className="text-gray-600 dark:text-neutral-300">Creada por:</span> {creatorLabel}</div>
              <div>
                <span className="text-gray-600 dark:text-neutral-300">Última modificación:</span> {updaterLabel}
                {updatedAtLabel ? ` — ${updatedAtLabel}` : ""}
              </div>
            </div>

            {/* Deadline + etiquetas */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tarea.deadline && (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  📅 {formatDateOnly(tarea.deadline)}
                </span>
              )}
              {warningDeadline()}
            </div>

            {tarea.etiquetas.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tarea.etiquetas.map((etiqueta, i) => (
                  <span key={i} className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                    #{etiqueta}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
