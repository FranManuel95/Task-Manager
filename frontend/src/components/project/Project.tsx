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

import { useProyectoActual } from "../../hooks/useProyectoActual";
import Columna from "./Columna";
import { ordenPrioridad, estados } from "./constantes";
import { Estado, Tarea, Prioridad } from "../../types";
import { useTareasStore } from "../../store/tAreasStore";
import { useAuthStore } from "../../store/authStore";
import ActivityPanel from "./ActivityPanel";
// import Collapsible from "../ui/Collapsible"; // ⛔️ Eliminado
import { useLocalStorage } from "../../hooks/useLocalStorage";

// 👇 chat flotante
import ChatDock from "./ChatDock";

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

  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = !!usuario?.email && !!proyecto && usuario.email === proyecto.creadoPor;

  // 🔒 ya no usamos el colapsible visual, pero mantenemos la preferencia por si quieres reutilizarla
  const [, setActivityOpen] = useLocalStorage<boolean>(`proj:${proyectoId}:activityOpen`, true);

  // clave para refrescar actividad
  const [auditKey, setAuditKey] = useState(0);

  // 🔵 estado para el overlay a pantalla casi completa
  const [activityOpenOverlay, setActivityOpenOverlay] = useState(false);

  const handleAgregar = () => {
    const email = emailNuevo.trim();
    if (!email || !proyectoId || !isAdmin) return;
    agregarColaborador(proyectoId, email);
    setEmailNuevo("");
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

  // ⌘K / Ctrl+K enfoca el buscador
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

  // Bloquear scroll de fondo y cerrar con ESC cuando esté abierto el overlay
  useEffect(() => {
    if (!activityOpenOverlay) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivityOpenOverlay(false);
    };
    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onEsc);
    };
  }, [activityOpenOverlay]);

  return (
    <div className="p-6 theme-bg min-h-screen transition-colors duration-500 relative">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-10 -mx-4 mb-6 border bg-[rgb(var(--color-card))]/80 px-4 py-4 backdrop-blur md:mx-0 md:mt-4 md:rounded-b-xl md:border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Identidad */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm">
              <span className="text-sm font-semibold">PR</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight md:text-2xl">
                {proyecto.nombre}
              </h1>
              <p className="text-sm text-gray-500 dark:text-neutral-400 line-clamp-2">
                {proyecto.descripcion}
              </p>
            </div>
          </div>

          {/* Badges + botón actividad */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300">
                Admin
              </span>
            ) : (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200">
                Colaborador
              </span>
            )}
            {proyectoDeadline && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300">
                Deadline: {new Date(proyectoDeadline).toLocaleDateString()}
              </span>
            )}

            {/* Botón para abrir overlay de Actividad */}
            <button
              onClick={() => {
                setActivityOpen(true); // conservamos la preferencia aunque ya no se use visualmente
                setActivityOpenOverlay(true);
              }}
              className="ml-2 inline-flex items-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition"
            >
              Ver actividad
            </button>
          </div>
        </div>

        {/* ===== Toolbar ===== */}
        <div className="mt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative w-full md:w-auto md:flex-1">
              <input
                id="project-search"
                type="text"
                aria-label="Buscar tareas"
                placeholder="Buscar tareas por título…"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ⌘K
              </span>
            </label>

            <label className="md:w-60">
              <select
                aria-label="Filtrar por prioridad"
                value={filterPrioridad}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFilterPrioridad(e.target.value as Prioridad | "todas")
                }
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
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

      {/* ===== Grid principal: tablero + sidebar ===== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Tablero principal */}
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
                      onAgregar={agregarTarea}
                      onEliminar={eliminarTarea}
                      onEditar={editarTarea}
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
                    <p className="text-sm font-medium">{activeTarea.titulo}</p>
                  </motion.div>
                )}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </section>

        {/* Sidebar derecho: invitar */}
        <aside className="xl:sticky xl:top-24 flex h-fit flex-col gap-4">
          {/* Invitar colaborador */}
          <section className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--color-border))] px-3 py-2">
              <h3 className="text-sm font-semibold">Invitar colaborador</h3>
              {!isAdmin && <span className="text-xs text-gray-500">Solo admin</span>}
            </div>
            <div className="p-3">
              <div className="flex gap-2">
                <input
                  id="invite-email"
                  type="email"
                  value={emailNuevo}
                  onChange={(e) => setEmailNuevo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-transparent px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
                  disabled={!isAdmin}
                />
                <button
                  onClick={handleAgregar}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  disabled={!isAdmin || !emailNuevo.trim()}
                >
                  Añadir
                </button>
              </div>
            </div>
          </section>

          {/* Botón para ver actividad (abre overlay) */}
          <section className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] shadow-sm">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <h3 className="text-sm font-semibold">Actividad reciente</h3>
              <button
                onClick={() => {
                  setActivityOpen(true);
                  setActivityOpenOverlay(true);
                }}
                className="rounded-lg border border-[rgb(var(--color-border))] px-2.5 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition"
                title="Abrir actividad"
              >
                Ver actividad
              </button>
            </div>
          </section>
        </aside>
      </div>

      {/* === Overlay de Actividad a pantalla casi completa === */}
      {activityOpenOverlay &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            aria-labelledby="activity-dialog-title"
            onMouseDown={(e) => {
              // Cerrar al hacer click en el backdrop (pero no dentro del panel)
              if (e.target === e.currentTarget) setActivityOpenOverlay(false);
            }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Contenedor del panel */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative mx-4 h-[85vh] w-[min(1100px,92vw)] overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] shadow-2xl"
            >
              {/* Header del panel */}
              <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <h2 id="activity-dialog-title" className="text-base font-semibold">
                    Actividad del proyecto
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuditKey((k) => k + 1)}
                    className="rounded-lg border border-[rgb(var(--color-border))] px-2.5 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition"
                    title="Actualizar actividad"
                  >
                    Actualizar
                  </button>
                  <button
                    onClick={() => setActivityOpenOverlay(false)}
                    className="rounded-lg border border-[rgb(var(--color-border))] px-2.5 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition"
                    aria-label="Cerrar"
                    title="Cerrar"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Contenido desplazable */}
              <div className="h-full overflow-y-auto">
                {proyectoId && (
                  <ActivityPanel
                    key={`${proyectoId}-${auditKey}`}
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
        )}

      {/* === Chat flotante tipo redes sociales === */}
      {proyectoId && <ChatDock proyectoId={proyectoId} />}
    </div>
  );
}
