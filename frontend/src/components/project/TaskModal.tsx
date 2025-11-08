import { useEffect, useState, ChangeEvent, KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Estado, Prioridad } from "../../types";
import { estados as ESTADOS_UI } from "./constantes";

// ...imports iguales...
export type TaskModalValues = {
  estado: Estado;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  deadline: string | null; // YYYY-MM-DD o null
  etiquetas: string[];
};

export type ProjectModalValues = {
  nombre: string;
  descripcion: string;
  color: string;
  deadline: string | null; // YYYY-MM-DD o null
};

type BaseCommon = {
  open: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  proyectoDeadline?: string | null;
  /** 🔹 NUEVO: muestra los campos en solo lectura */
  readOnly?: boolean;
  /** 🔹 NUEVO: botón "Editar" en modo solo lectura */
  onEditClick?: () => void;
};

type TaskVariant = BaseCommon & {
  variant?: "task";
  initialValues?: Partial<TaskModalValues>;
  onConfirm: (payload: TaskModalValues) => void;
};

type ProjectVariant = BaseCommon & {
  variant: "project";
  initialValues?: Partial<ProjectModalValues>;
  onConfirm: (payload: ProjectModalValues) => void;
};

type Props = TaskVariant | ProjectVariant;

// ---- Helpers ----
function toDateInputValue(raw: string): string {
  try {
    const d = raw.length > 10 ? new Date(raw) : new Date(raw + "T00:00:00");
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

export default function TaskModal(props: Props) {
  const {
    open,
    mode,
    onClose,
    proyectoDeadline,
    initialValues,
    readOnly = false,         // 🔹 NUEVO
    onEditClick,              // 🔹 NUEVO
  } = props as any;

  const variant: "task" | "project" = (props as any).variant ?? "task";

  // --- Estado (según variante) ---
  const [estado, setEstado] = useState<Estado>(
    variant === "task" ? (initialValues?.estado ?? "por-hacer") : "por-hacer"
  );
  const [titulo, setTitulo] = useState(
    variant === "task" ? (initialValues?.titulo ?? "") : ""
  );
  const [prioridad, setPrioridad] = useState<Prioridad>(
    variant === "task" ? (initialValues?.prioridad ?? "media") : "media"
  );
  const [etiquetaInput, setEtiquetaInput] = useState("");
  const [etiquetas, setEtiquetas] = useState<string[]>(
    variant === "task" ? (initialValues?.etiquetas ?? []) : []
  );

  const [nombre, setNombre] = useState(
    variant === "project" ? (initialValues?.nombre ?? "") : ""
  );
  const [color, setColor] = useState(
    variant === "project" ? (initialValues?.color ?? "#3B82F6") : "#3B82F6"
  );

  // 🔹 NUEVO: color temporal para el picker (solo project)
  const [tempColor, setTempColor] = useState(
    variant === "project" ? (initialValues?.color ?? "#3B82F6") : "#3B82F6"
  );

  const [descripcion, setDescripcion] = useState(initialValues?.descripcion ?? "");
  const [deadline, setDeadline] = useState<string>(
    initialValues?.deadline ? toDateInputValue(initialValues.deadline as string) : ""
  );
  const [deadlineError, setDeadlineError] = useState("");

  const maxDate = proyectoDeadline ? toDateInputValue(proyectoDeadline) : "";

  useEffect(() => {
    if (!open) return;
    if (variant === "task") {
      setEstado(initialValues?.estado ?? "por-hacer");
      setTitulo(initialValues?.titulo ?? "");
      setPrioridad(initialValues?.prioridad ?? "media");
      setEtiquetas(initialValues?.etiquetas ?? []);
      setEtiquetaInput("");
    } else {
      setNombre(initialValues?.nombre ?? "");
      const initColor = initialValues?.color ?? "#3B82F6";
      setColor(initColor);
      setTempColor(initColor); // 🔹 sincroniza vista previa con el aplicado
    }
    setDescripcion(initialValues?.descripcion ?? "");
    setDeadline(initialValues?.deadline ? toDateInputValue(initialValues.deadline as string) : "");
    setDeadlineError("");

    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const listener = (e: any) => onEsc(e as any);
    window.addEventListener("keydown", listener as any);
    return () => window.removeEventListener("keydown", listener as any);
  }, [open, onClose, initialValues, variant]);

  if (!open) return null;

  const addEtiqueta = () => {
    if (readOnly) return; // 🔹 bloquea en solo lectura
    const v = etiquetaInput.trim();
    if (!v) return;
    setEtiquetas((prev) => [...prev, v]);
    setEtiquetaInput("");
  };

  const handleSubmit = () => {
    if (readOnly) return; // 🔹 no envía en solo lectura
    setDeadlineError("");

    if (variant === "task") {
      if (!titulo.trim()) return;
      if (deadline && maxDate) {
        const dTask = new Date(deadline + "T00:00:00");
        const dProj = new Date(maxDate + "T00:00:00");
        if (dTask.getTime() > dProj.getTime()) {
          setDeadlineError("No puede ser posterior al deadline del proyecto.");
          return;
        }
      }
      (props as TaskVariant).onConfirm({
        estado,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        prioridad,
        deadline: deadline || null,
        etiquetas,
      });
    } else {
      if (!nombre.trim()) return;
      (props as ProjectVariant).onConfirm({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        color, // 🔹 se envía el color APLICADO (tras pulsar Aceptar)
        deadline: deadline || null,
      });
    }
  };

  const titleText =
    variant === "task"
      ? mode === "create" ? "Nueva tarea" : "Editar tarea"
      : mode === "create" ? "Nuevo proyecto" : "Editar proyecto";

  const submitText =
    readOnly
      ? "Editar" // 🔹 en solo lectura mostramos "Editar"
      : variant === "task"
        ? mode === "create" ? "Crear tarea" : "Guardar cambios"
        : mode === "create" ? "Crear proyecto" : "Guardar cambios";

  // 🔹 clases comunes para disabled
  const disabledCls = readOnly ? "opacity-60 pointer-events-none select-none" : "";

  const applyTempColor = () => {
    if (readOnly) return;
    setColor(tempColor);
  };

  const isTempEqual = tempColor === color;

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
          <h3 className="text-sm font-semibold">{titleText}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-[rgb(var(--color-border))] px-2 py-1 text-sm hover:bg-[rgb(var(--color-card))]/70 hover:cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3">
          {variant === "task" ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-xs opacity-70 ">Columna</span>
                  <select
                    value={estado}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setEstado(e.target.value as Estado)}
                    disabled={readOnly}
                    className={`hover:cursor-pointer w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${disabledCls}`}
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
                    disabled={readOnly}
                    className={`hover:cursor-pointer w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${disabledCls}`}
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
                  disabled={readOnly}
                  className={`w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${disabledCls}`}
                  placeholder="Título de la tarea"
                  autoFocus={!readOnly}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (!readOnly && e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <label className="text-sm">
                <span className="mb-1 block text-xs opacity-70">Nombre</span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={readOnly}
                  className={`w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${disabledCls}`}
                  placeholder="Nombre del proyecto"
                  autoFocus={!readOnly}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (!readOnly && e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </label>

              {/* 🔹 Campo de color con botón Aceptar */}
              <div className="text-sm">
                <span className="mb-1 block text-xs opacity-70">Color</span>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Picker controla SOLO tempColor */}
                  <input
                    type="color"
                    value={tempColor}
                    onChange={(e) => setTempColor(e.target.value)}
                    disabled={readOnly}
                    className={`h-10 w-16 cursor-pointer rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] ${readOnly ? "pointer-events-none" : ""}`}
                    aria-label="Color del proyecto (previsualización)"
                    title="Selecciona un color y pulsa Aceptar para aplicarlo"
                  />

                  {/* Botón Aceptar aplica temp -> color */}
                  <button
                    type="button"
                    onClick={applyTempColor}
                    disabled={readOnly || isTempEqual}
                    className={`rounded-xl px-3 py-1.5 text-sm transition ${
                      readOnly || isTempEqual
                        ? "cursor-not-allowed border border-[rgb(var(--color-border))] text-gray-400"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                    title={isTempEqual ? "Ya está aplicado" : "Aplicar este color"}
                  >
                    Aceptar
                  </button>

                  {/* Vista del color aplicado actualmente en el formulario */}
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-6 w-6 rounded-full border border-[rgb(var(--color-border))] shadow-sm"
                      style={{ backgroundColor: color }}
                      title={`Color aplicado: ${color}`}
                    />
                    <code className="text-xs">{color}</code>
                  </div>
                </div>

                {/* Mensaje de ayuda si hay diferencia */}
                {!readOnly && tempColor !== color && (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-400">
                    Previsualizando <code>{tempColor}</code>. Pulsa <strong>Aceptar</strong> para aplicarlo.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Compartidos */}
          <label className="text-sm">
            <span className="mb-1 block text-xs opacity-70">Descripción</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={readOnly}
              className={`w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${disabledCls}`}
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
                max={variant === "task" ? (maxDate || "") : undefined}
                onChange={(e) => {
                  if (readOnly) return;
                  setDeadline(e.target.value);
                  setDeadlineError("");
                }}
                disabled={readOnly}
                aria-invalid={!!deadlineError}
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ","date-icon-pointer",
                  deadlineError
                    ? "border-rose-400 focus:ring-rose-300/50"
                    : "border-[rgb(var(--color-border))] focus:ring-indigo-400",
                  "bg-transparent dark:[color-scheme:dark] ",
                  disabledCls,
                ].join(" ")}
              />
              {deadlineError && !readOnly && (
                <p className="mt-1 text-[11px] text-rose-500">{deadlineError}</p>
              )}
            </label>

            {variant === "task" ? (
              <label className="text-sm">
                <span className="mb-1 block text-xs opacity-70">Etiquetas</span>
                <div className="flex gap-2">
                  <input
                    value={etiquetaInput}
                    onChange={(e) => setEtiquetaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (!readOnly && e.key === "Enter") {
                        e.preventDefault();
                        addEtiqueta();
                      }
                    }}
                    disabled={readOnly}
                    className={`w-full rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${disabledCls}`}
                    placeholder="escribe y pulsa Enter"
                  />
                  <button
                    type="button"
                    onClick={addEtiqueta}
                    disabled={readOnly}
                    className={`rounded-lg border border-[rgb(var(--color-border))] px-3 text-sm hover:cursor-pointer hover:bg-[rgb(var(--color-card))]/70 ${readOnly ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    Añadir
                  </button>
                </div>
                {etiquetas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {etiquetas.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </label>
            ) : (
              <div />
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-[rgb(var(--color-border))] px-4 py-2 text-sm hover:cursor-pointer hover:bg-[rgb(var(--color-card))]/70"
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </button>
            <button
              onClick={() => {
                if (readOnly) {
                  onEditClick?.(); // 🔹 abre edición
                } else {
                  handleSubmit();
                }
              }}
              disabled={readOnly ? false : (variant === "task" ? !titulo.trim() : !nombre.trim())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
