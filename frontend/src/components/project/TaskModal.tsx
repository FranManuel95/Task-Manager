// src/components/project/TaskModal.tsx
import { useEffect, useState, ChangeEvent, KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Estado, Prioridad } from "../../types";
import { estados as ESTADOS_UI } from "./constantes";

export type TaskModalValues = {
  estado: Estado;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  deadline: string | null;
  etiquetas: string[];
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  proyectoDeadline?: string | null;
  /** valores iniciales; en create puedes omitir y usar defaults */
  initialValues?: Partial<TaskModalValues>;
  onConfirm: (payload: TaskModalValues) => void;
};

export default function TaskModal({
  open,
  mode,
  onClose,
  proyectoDeadline,
  initialValues,
  onConfirm,
}: Props) {
  const [estado, setEstado] = useState<Estado>(initialValues?.estado ?? "por-hacer");
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initialValues?.descripcion ?? "");
  const [prioridad, setPrioridad] = useState<Prioridad>(initialValues?.prioridad ?? "media");
  const [deadline, setDeadline] = useState<string>(initialValues?.deadline ?? "");
  const [etiquetaInput, setEtiquetaInput] = useState("");
  const [etiquetas, setEtiquetas] = useState<string[]>(initialValues?.etiquetas ?? []);
  const [deadlineError, setDeadlineError] = useState("");

  useEffect(() => {
    if (!open) return;
    // reset cuando abre con nuevos initialValues
    setEstado(initialValues?.estado ?? "por-hacer");
    setTitulo(initialValues?.titulo ?? "");
    setDescripcion(initialValues?.descripcion ?? "");
    setPrioridad(initialValues?.prioridad ?? "media");
    setDeadline(initialValues?.deadline ?? "");
    setEtiquetaInput("");
    setEtiquetas(initialValues?.etiquetas ?? []);
    setDeadlineError("");

    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const listener = (e: any) => onEsc(e as any);
    window.addEventListener("keydown", listener as any);
    return () => window.removeEventListener("keydown", listener as any);
  }, [open, onClose, initialValues]);

  if (!open) return null;

  const addEtiqueta = () => {
    const v = etiquetaInput.trim();
    if (!v) return;
    setEtiquetas((prev) => [...prev, v]);
    setEtiquetaInput("");
  };

  const handleSubmit = () => {
    setDeadlineError("");
    if (!titulo.trim()) return;

    if (deadline && proyectoDeadline) {
      const dTask = new Date(deadline);
      const dProj = new Date(proyectoDeadline);
      if (dTask.getTime() > dProj.getTime()) {
        setDeadlineError("No puede ser posterior al deadline del proyecto.");
        return;
      }
    }

    onConfirm({
      estado,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      prioridad,
      deadline: deadline || null,
      etiquetas,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-[min(560px,94vw)] rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {mode === "create" ? "Nueva tarea" : "Editar tarea"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-[rgb(var(--color-border))] px-2 py-1 text-sm hover:bg-[rgb(var(--color-card))]/70"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs opacity-70">Columna</span>
              <select
                value={estado}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEstado(e.target.value as Estado)}
                className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {ESTADOS_UI.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titulo}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs opacity-70">Prioridad</span>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as Prioridad)}
                className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block text-xs opacity-70">Título</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Título de la tarea"
              autoFocus
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs opacity-70">Descripción</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              rows={3}
              placeholder="(opcional)"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs opacity-70">Fecha límite</span>
              <input
                type="date"
                value={deadline}
                max={proyectoDeadline ?? ""}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  setDeadlineError("");
                }}
                aria-invalid={!!deadlineError}
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2",
                  deadlineError
                    ? "border-rose-400 focus:ring-rose-300/50"
                    : "border-[rgb(var(--color-border))] focus:ring-indigo-400",
                  "bg-transparent",
                ].join(" ")}
              />
              {deadlineError && (
                <p className="mt-1 text-[11px] text-rose-500">{deadlineError}</p>
              )}
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs opacity-70">Etiquetas</span>
              <div className="flex gap-2">
                <input
                  value={etiquetaInput}
                  onChange={(e) => setEtiquetaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEtiqueta();
                    }
                  }}
                  className="w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="escribe y pulsa Enter"
                />
                <button
                  type="button"
                  onClick={addEtiqueta}
                  className="rounded-lg border border-[rgb(var(--color-border))] px-3 text-sm hover:bg-[rgb(var(--color-card))]/70"
                >
                  Añadir
                </button>
              </div>
              {etiquetas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {etiquetas.map((t, i) => (
                    <span key={i} className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[rgb(var(--color-border))] px-4 py-2 text-sm hover:bg-[rgb(var(--color-card))]/70"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!titulo.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {mode === "create" ? "Crear tarea" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
