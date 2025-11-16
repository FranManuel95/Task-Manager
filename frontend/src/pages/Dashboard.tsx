import { Link } from "react-router-dom";
import { useState, useEffect, ChangeEvent, FormEvent, useMemo } from "react";
import { useTareasStore } from "../store/tareasStore";
import { parseISO, differenceInDays, isBefore } from "date-fns";
import { useAuthStore } from "../store/authStore";
import ModalConfirmacion from "../components/modals/ModalConfirmacion";
import TaskModal from "../components/project/TaskModal";
import TopBar from "../components/layout/TopBar";

type ProyectoType = {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  deadline?: string | null;
  tareas: {
    [key: string]: Array<{
      id: string;
      titulo: string;
      completado?: boolean;
      prioridad?: "alta" | "media" | "baja";
      deadline?: string | null;
      descripcion?: string;
      etiquetas?: string[];
    }>;
  };
  usuarios?: string[];
  creadoPor?: string;
};

function idToNum(id: string): number {
  const onlyDigits = id.replace(/\D/g, "");
  return onlyDigits ? Number(onlyDigits) : 0;
}

function formatDateOnly(value: string): string {
  try {
    const d =
      value.length > 10 ? new Date(value) : new Date(value + "T00:00:00");
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  } catch {
    return value;
  }
}

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

export default function Dashboard() {
  const email = useAuthStore((state) => state.usuario?.email || "");
  const usuario = useAuthStore((state) => state.usuario);

  const setUsuarioActual = useTareasStore((state) => state.setUsuarioActual);
  const getProyectosPorUsuario = useTareasStore(
    (state) => state.getProyectosPorUsuario,
  );
  const agregarProyecto = useTareasStore((state) => state.agregarProyecto);
  const editarProyecto = useTareasStore((state) => state.editarProyecto);
  const eliminarProyecto = useTareasStore((state) => state.eliminarProyecto);

  // 🔹 NUEVO: acción para pedir al backend e hidratar el store
  const fetchProyectosAndHydrate = useTareasStore(
    (s) => (s as any).fetchProyectosAndHydrate,
  );

  const proyectosState = useTareasStore((s) => s.proyectos);

  useEffect(() => {
    if (email) {
      setUsuarioActual(email);
      // 🔹 NUEVO: traer proyectos reales del backend y meterlos en el store
      fetchProyectosAndHydrate?.();
    }
  }, [email, setUsuarioActual, fetchProyectosAndHydrate]);

  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");

  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#3B82F6");
  const [nuevoDeadline, setNuevoDeadline] = useState("");

  const [proyectoAEditar, setProyectoAEditar] = useState<ProyectoType | null>(
    null,
  );
  const [proyectoAEliminar, setProyectoAEliminar] =
    useState<ProyectoType | null>(null);

  const proyectos = useMemo(() => {
    return getProyectosPorUsuario(email) as Record<string, ProyectoType>;
  }, [email, proyectosState, getProyectosPorUsuario]);

  const proyectosFiltrados = useMemo(() => {
    return Object.values(proyectos)
      .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => {
        const totalA = Object.values(a.tareas).flat().length;
        const totalB = Object.values(b.tareas).flat().length;
        const compA = a.tareas["completado"]?.length || 0;
        const compB = b.tareas["completado"]?.length || 0;
        switch (orden) {
          case "recientes":
            return idToNum(b.id) - idToNum(a.id);
          case "antiguos":
            return idToNum(a.id) - idToNum(b.id);
          case "alfabetico":
            return a.nombre.localeCompare(b.nombre);
          case "progreso":
            return (compB / totalB || 0) - (compA / totalA || 0);
          default:
            return 0;
        }
      });
  }, [proyectos, busqueda, orden]);

  const handleCrearProyecto = (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    agregarProyecto(
      email,
      nuevoNombre.trim(),
      nuevaDescripcion.trim(),
      nuevoColor,
      nuevoDeadline || null,
    );
    setNuevoNombre("");
    setNuevaDescripcion("");
    setNuevoColor("#3B82F6");
    setNuevoDeadline("");
    setMostrarCrear(false);
  };

  const handleEditarProyecto = (e: FormEvent) => {
    e.preventDefault();
    if (!proyectoAEditar) return;
    editarProyecto(
      proyectoAEditar.id,
      nuevoNombre,
      nuevaDescripcion,
      nuevoColor,
      nuevoDeadline || null,
    );
    setProyectoAEditar(null);
    setMostrarEditar(false);
  };

  const confirmarEliminar = () => {
    if (proyectoAEliminar) eliminarProyecto(proyectoAEliminar.id);
    setProyectoAEliminar(null);
  };

  // ⌘K / Ctrl+K enfoca buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("dashboard-search");
        (el as HTMLInputElement | null)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="p-6 theme-bg min-h-screen transition-colors duration-500 relative">
      {/* ===== Header con misma estructura que Project.tsx ===== */}
      <header className="sticky top-0 z-10 -mx-4 mb-6 border-gray-200 dark:border-neutral-700 bg-[rgb(var(--color-card))]/80 px-4 py-4 backdrop-blur md:mx-0 md:mt-4 md:rounded-b-xl md:border">
        <TopBar title="Gestor de Proyectos" />

        {/* Identidad + acciones */}
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Identidad */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <h1 className="text-xl font-semibold leading-tight md:text-2xl">
                Tus Proyectos
              </h1>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMostrarCrear(true)}
              className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition hover:cursor-pointer"
            >
              Nuevo Proyecto
            </button>
          </div>
        </div>

        {/* Toolbar (buscador + orden) */}
        <div className="mt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative w-full md:w-auto md:flex-1">
              <input
                id="dashboard-search"
                type="text"
                aria-label="Buscar proyectos"
                placeholder="Buscar proyectos…"
                value={busqueda}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBusqueda(e.target.value)
                }
                className="w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ⌘K
              </span>
            </label>

            <label className="md:w-60">
              <select
                aria-label="Ordenar proyectos"
                value={orden}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setOrden(e.target.value)
                }
                className="w-full rounded-xl hover:cursor-pointer hover:border-gray-500 border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguos">Más antiguos</option>
                <option value="alfabetico">Alfabéticamente</option>
                <option value="progreso">Mayor progreso</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      {/* ===== Contenido ===== */}
      <div className="p-6 theme-bg min-h-screen transition-colors duration-500">
        {/* === Tabla de proyectos === */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white dark:border-neutral-800 dark:bg-neutral-800">
          {proyectosFiltrados.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800 ">
              <thead className="bg-gray-50 dark:bg-neutral-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                    Proyecto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                    Progreso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                    Tareas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                    Color
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {proyectosFiltrados.map((proyecto) => {
                  const total = Object.values(proyecto.tareas).flat().length;
                  const done = proyecto.tareas["completado"]?.length || 0;
                  const progreso = total ? Math.round((done / total) * 100) : 0;

                  const deadlineClass = proyecto.deadline
                    ? isBefore(parseISO(proyecto.deadline), new Date())
                      ? "text-red-600 dark:text-red-400"
                      : differenceInDays(
                            parseISO(proyecto.deadline),
                            new Date(),
                          ) <= 3
                        ? "text-orange-500 dark:text-amber-400"
                        : "text-gray-700 dark:text-neutral-300"
                    : "text-gray-400 dark:text-neutral-500";

                  return (
                    <tr
                      key={proyecto.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-800/60 "
                    >
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <Link
                          to={`/proyecto/${proyecto.id}`}
                          className="font-medium text-gray-900 dark:text-neutral-100 hover:underline hover:cursor-pointer"
                        >
                          {proyecto.nombre}
                        </Link>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-gray-600 dark:text-neutral-300 max-w-[40ch] truncate">
                        {proyecto.descripcion}
                      </td>

                      <td className="px-4 py-3 align-top w-56">
                        <div className="w-full h-2 rounded bg-gray-200 dark:bg-neutral-800">
                          <div
                            className="h-2 rounded bg-green-500"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-neutral-400">
                          {progreso}%
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-neutral-200 whitespace-nowrap">
                        {done}/{total}
                      </td>

                      <td
                        className={`px-4 py-3 align-top text-sm whitespace-nowrap ${deadlineClass}`}
                      >
                        {proyecto.deadline
                          ? `📅 ${formatDateOnly(proyecto.deadline)}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-5 h-5 rounded-full border border-gray-200 dark:border-neutral-700 shadow-sm"
                            style={{ backgroundColor: proyecto.color }}
                          />
                          <code className="text-xs text-gray-700 dark:text-neutral-300">
                            {proyecto.color}
                          </code>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setProyectoAEditar(proyecto);
                              setNuevoNombre(proyecto.nombre);
                              setNuevaDescripcion(proyecto.descripcion);
                              setNuevoColor(proyecto.color);
                              setNuevoDeadline(
                                proyecto.deadline
                                  ? toDateInputValue(proyecto.deadline)
                                  : "",
                              );
                              setMostrarEditar(true);
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm hover:cursor-pointer"
                            title="Editar proyecto"
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setProyectoAEliminar(proyecto);
                            }}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm hover:cursor-pointer"
                            title="Eliminar proyecto"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-neutral-400">
              No se encontraron proyectos. ¡Crea uno para comenzar!
            </div>
          )}
        </div>

        {/* Crear proyecto con TaskModal */}
        {mostrarCrear && (
          <TaskModal
            variant="project"
            mode="create"
            open={true}
            onClose={() => setMostrarCrear(false)}
            initialValues={{
              nombre: nuevoNombre,
              descripcion: nuevaDescripcion,
              color: nuevoColor,
              deadline: nuevoDeadline || null,
            }}
            onConfirm={(payload) => {
              agregarProyecto(
                email,
                payload.nombre.trim(),
                payload.descripcion?.trim() ?? "",
                payload.color,
                payload.deadline || null,
              );
              setNuevoNombre("");
              setNuevaDescripcion("");
              setNuevoColor("#3B82F6");
              setNuevoDeadline("");
              setMostrarCrear(false);
            }}
          />
        )}

        {/* Editar proyecto con el mismo TaskModal */}
        {mostrarEditar && proyectoAEditar && (
          <TaskModal
            variant="project"
            mode="edit"
            open={true}
            onClose={() => {
              setMostrarEditar(false);
              setProyectoAEditar(null);
            }}
            initialValues={{
              nombre: nuevoNombre,
              descripcion: nuevaDescripcion,
              color: nuevoColor,
              deadline: nuevoDeadline || null,
            }}
            onConfirm={(payload) => {
              editarProyecto(
                proyectoAEditar.id,
                payload.nombre,
                payload.descripcion,
                payload.color,
                payload.deadline || null,
              );
              setMostrarEditar(false);
              setProyectoAEditar(null);
            }}
          />
        )}

        {proyectoAEliminar && (
          <ModalConfirmacion
            title="Eliminar proyecto"
            description={`¿Seguro que deseas eliminar el proyecto "${proyectoAEliminar.nombre}"?`}
            confirmLabel="Eliminar"
            onClose={() => setProyectoAEliminar(null)}
            onConfirm={confirmarEliminar}
          />
        )}
      </div>
    </div>
  );
}
