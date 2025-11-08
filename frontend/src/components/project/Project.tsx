// src/components/project/Project.tsx
import {
  DndContext,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { useProyectoActual } from "../../hooks/useProyectoActual";
import Columna from "./Columna";
import { ordenPrioridad, estados } from "./constantes";
import { Estado, Tarea, Prioridad } from "../../types";
import { useTareasStore } from "../../store/tareasStore";
import { useAuthStore } from "../../store/authStore";
import ActivityPanel from "./ActivityPanel";
import ChatDock from "./ChatDock";
import TopBar from "../layout/TopBar";

import TaskModal, { TaskModalValues } from "./TaskModal";

/* ===================== Overlay de Actividad ===================== */
function ActivityOverlay({
  open,
  onClose,
  proyectoId,
  onRefresh,
  refreshKey,
}: {
  open: boolean;
  onClose: () => void;
  proyectoId: string | null;
  onRefresh: () => void;
  refreshKey: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="activity-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative mx-4 h-[85vh] w-[min(1100px,92vw)] overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] px-4 py-3 dark:text-neutral-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <h2 id="activity-dialog-title" className="text-base font-semibold">
              Actividad del proyecto
            </h2>
          </div>

          <div className="flex items-center gap-2 ">
            <button
              onClick={onRefresh}
              className="rounded-lg border border-[rgb(var(--color-border))] px-2.5 py-1.5 text-sm hover:cursor-pointer  transition hover:border-gray-500"
              title="Actualizar actividad"
            >
              Actualizar
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-[rgb(var(--color-border))] px-2.5 py-1.5 text-sm hover:cursor-pointer  transition hover:border-gray-500"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="h-full overflow-y-auto">
          {proyectoId && (
            <ActivityPanel
              key={`${proyectoId}-${refreshKey}`}
              proyectoId={proyectoId}
              initialLimit={50}
              enableFilter={true}
              compact={false}
              className="min-h-full"
            />
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* =============== mini formulario interno de invitación =============== */
function InviteInner({ onInvite }: { onInvite: (email: string) => void }) {
  const [email, setEmail] = useState("");
  return (
    <div className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@ejemplo.com"
        className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
      />
      <button
        onClick={() => {
          const val = email.trim();
          if (!val || !/\S+@\S+\.\S+/.test(val)) {
            toast.error("Introduce un email válido");
            return;
          }
          onInvite(val);
        }}
        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 hover:cursor-pointer hover:border-gray-500"
      >
        Añadir
      </button>
    </div>
  );
}

/* ========================= Componente principal ========================= */
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

  // Invitar colaboradores
  const [inviteOpen, setInviteOpen] = useState(false);

  // Overlay Actividad
  const [activityOpenOverlay, setActivityOpenOverlay] = useState(false);
  const [auditKey, setAuditKey] = useState(0);

  // Modal Crear Tarea
  const [createOpen, setCreateOpen] = useState(false);

  // Modal Editar Tarea
  const [editOpen, setEditOpen] = useState(false);
  const [editCtx, setEditCtx] = useState<{ tarea: Tarea | null; parent: Estado | null }>({
    tarea: null,
    parent: null,
  });

  const agregarColaborador = useTareasStore((state) => state.agregarColaborador);
  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = !!usuario?.email && !!proyecto && usuario.email === proyecto.creadoPor;

  const handleInvite = (email: string) => {
    if (!proyectoId || !isAdmin) return;
    agregarColaborador(proyectoId, email);
    toast.success("Invitación enviada");
  };

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-7xl px-6">
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Proyecto no encontrado
        </div>
      </div>
    );
  }

  /* ====== DnD ====== */
  const handleDragStart = (event: DragStartEvent) => {
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

  const miembros = useMemo(() => (proyecto?.usuarios ?? []).filter(Boolean), [proyecto?.usuarios]);

  // ⌘K / Ctrl+K enfoca buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("project-search");
        (el as HTMLInputElement | null)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ====== Abrir modal de edición desde cada card ====== */
  const handleEditRequest = (tarea: Tarea, parent: Estado) => {
    setEditCtx({ tarea, parent });
    setEditOpen(true);
  };

  return (
    <div className="p-6 theme-bg min-h-screen transition-colors duration-500 relative">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-10 -mx-4 mb-6 border border-gray-200 dark:border-neutral-700 bg-[rgb(var(--color-card))]/80 px-4 py-4 backdrop-blur md:mx-0 md:mt-4 md:rounded-b-xl md:border">
        <TopBar title="Gestor de Tareas" showGoProjects />

        {/* Identidad + acciones */}
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Identidad */}
          <div className="flex items-center gap-3">
            <span className="mb-1 text-3xl">📁</span>
            <div>
              <h1 className="text-xl font-semibold leading-tight md:text-2xl">
                {proyecto.nombre}
              </h1>
              <p className="text-sm text-gray-500 dark:text-neutral-400 line-clamp-2">
                {proyecto.descripcion}
              </p>
            </div>
          </div>

          {/* Acciones y estado */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Avatares */}
            <div className="flex -space-x-2">
              {miembros.slice(0, 5).map((m, idx) => (
                <div
                  key={m + idx}
                  className="grid place-items-center rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] shadow-sm text-[10px] font-semibold w-7 h-7"
                  title={m}
                  aria-label={m}
                >
                  {(m.split("@")[0] || m).slice(0, 2).toUpperCase()}
                </div>
              ))}
              {miembros.length > 5 && (
                <div className="grid place-items-center rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] text-[10px] w-7 h-7">
                  +{miembros.length - 5}
                </div>
              )}
            </div>

            {/* Invitar */}
            <button
              onClick={() => setInviteOpen(true)}
              className="dark:hover:bg-gray-400  ml-2 inline-flex items-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-1.5 text-sm hover:cursor-pointer transition hover:border-gray-500"
            >
              Invitar colaborador
            </button>

            {/* Actividad */}
            <button
              onClick={() => setActivityOpenOverlay(true)}
              className="dark:hover:bg-gray-400 hover:cursor-pointer inline-flex items-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-1.5 text-sm  transition hover:border-gray-500"
            >
              Actividad
            </button>

            {/* Crear tarea */}
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center rounded-xl bg-blue-600 hover:cursor-pointer px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Nueva tarea
            </button>

            {/* Deadline del proyecto */}
            {proyectoDeadline && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300">
                Deadline: {new Date(proyectoDeadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* ===== Toolbar ===== */}
        <div className="mt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative w-full md:w-auto md:flex-1 focus:ring-indigo-400">
              <input
                id="project-search"
                type="text"
                aria-label="Buscar tareas"
                placeholder="Buscar tareas por título…"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3.5 py-2.5 text-sm outline-none transition focus:ring-indigo-400 focus:ring-2 hover:border-gray-500"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 focus:ring-indigo-400">
                ⌘K
              </span>
            </label>

            <label className="md:w-60 ">
              <select
                aria-label="Filtrar por prioridad"
                value={filterPrioridad}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFilterPrioridad(e.target.value as Prioridad | "todas")
                }
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3.5 py-2.5 text-sm outline-none transition focus:ring-indigo-400 focus:ring-2  hover:cursor-pointer hover:border-gray-500"
              >
                <option value="todas">Todas las prioridades</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      {/* ===== Tablero ===== */}
      <div className="grid grid-cols-1 gap-6">
        <section>
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {proyectoId &&
                estados.map((estado) => {
                  const tareasFiltradas = proyecto.tareas[estado.id]
                    .filter(
                      (t) =>
                        t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        (filterPrioridad === "todas" || t.prioridad === filterPrioridad)
                    )
                    .sort((a, b) => {
                      const aOrden = ordenPrioridad[a.prioridad];
                      const bOrden = ordenPrioridad[b.prioridad];
                      if (aOrden !== bOrden) return aOrden - bOrden;

                      if (a.deadline && b.deadline) {
                        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
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
                      onEliminar={eliminarTarea}
                      onEditar={editarTarea}
                      onEditRequest={handleEditRequest}
                      proyectoDeadline={proyectoDeadline}
                    />
                  );
                })}
            </motion.div>

            {createPortal(
              <DragOverlay>
                {activeTarea && (
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0.85 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-2 shadow-xl"
                  >
                    {/* Título en blanco en dark mode durante drag */}
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activeTarea.titulo}
                    </p>
                  </motion.div>
                )}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </section>
      </div>

      {/* === Modal CREAR === */}
      <TaskModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        proyectoDeadline={proyectoDeadline ?? null}
        onConfirm={(values: TaskModalValues) => {
          if (!proyectoId) return;
          // Mantengo tu agregarTarea (título + estado). Si quieres persistir deadline/desc/prioridad, podemos extenderla.
          agregarTarea(proyectoId, values.estado, values.titulo);
          setCreateOpen(false);
          toast.success("Tarea creada");
        }}
      />

      {/* === Modal EDITAR === */}
      <TaskModal
        open={editOpen}
        mode="edit"
        onClose={() => setEditOpen(false)}
        proyectoDeadline={proyectoDeadline ?? null}
        initialValues={{
          estado: editCtx.parent ?? "por-hacer",
          titulo: editCtx.tarea?.titulo ?? "",
          descripcion: editCtx.tarea?.descripcion ?? "",
          prioridad: editCtx.tarea?.prioridad ?? "media",
          deadline: editCtx.tarea?.deadline ?? "",
          etiquetas: editCtx.tarea?.etiquetas ?? [],
        }}
        onConfirm={(values: TaskModalValues) => {
          if (!proyectoId || !editCtx.tarea || !editCtx.parent) return;

          const tareaId = editCtx.tarea.id;
          const was = editCtx.parent;
          const destino = values.estado;

          // Si cambió de columna, primero movemos (optimista + backend)
          if (destino !== was) {
            moverTarea(proyectoId, tareaId, destino);
          }

          // Editamos usando la columna final
          editarTarea(
            proyectoId,
            destino,
            tareaId,
            values.titulo,
            values.descripcion,
            values.prioridad,
            values.deadline,
            values.etiquetas
          );

          setEditOpen(false);
          toast.success("Tarea actualizada");
        }}
      />

      {/* === Actividad (overlay) === */}
      <ActivityOverlay
        open={activityOpenOverlay}
        onClose={() => setActivityOpenOverlay(false)}
        proyectoId={proyectoId ?? null}
        onRefresh={() => setAuditKey((k) => k + 1)}
        refreshKey={auditKey}
      />

      {/* === Chat flotante === */}
      {proyectoId && <ChatDock proyectoId={proyectoId} />}

      {/* === Invitar (modal sencillo) === */}
      {inviteOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setInviteOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-[min(480px,94vw)] rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] p-4 shadow-2xl dark:text-white">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Invitar colaborador</h3>
                <button
                  onClick={() => setInviteOpen(false)}
                  className="rounded-lg border border-[rgb(var(--color-border))] px-2 py-1 text-sm hover:cursor-pointer  transition hover:border-gray-500"
                >
                  ✕
                </button>
              </header>
              <InviteInner
                onInvite={(email) => {
                  handleInvite(email);
                  setInviteOpen(false);
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
