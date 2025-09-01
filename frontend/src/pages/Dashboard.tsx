import { Link } from "react-router-dom";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useTareasStore } from "../store/tareasStore";
import { parseISO, differenceInDays, isBefore } from "date-fns";
import { useAuthStore } from "../store/authStore";
import ModalCrearProyecto from "../components/modals/ModalCrearProyecto";
import ModalEditarProyecto from "../components/modals/ModalEditarProyecto";
import ModalEliminarProyecto from "../components/modals/ModalEliminarProyecto";

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
    }>;
  };
};

export default function Dashboard() {
  const email = useAuthStore((state) => state.usuario?.email || "");
  const usuario = useAuthStore((state) => state.usuario);
  
  const setUsuarioActual = useTareasStore((state) => state.setUsuarioActual);
  const getProyectosPorUsuario = useTareasStore((state) => state.getProyectosPorUsuario);
  const agregarProyecto = useTareasStore((state) => state.agregarProyecto);
  const editarProyecto = useTareasStore((state) => state.editarProyecto);
  const eliminarProyecto = useTareasStore((state) => state.eliminarProyecto);

  const proyectos = getProyectosPorUsuario(email) as Record<string, ProyectoType>;

  useEffect(() => {
    if (email) setUsuarioActual(email);
  }, [email, setUsuarioActual]);

  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#3B82F6");
  const [nuevoDeadline, setNuevoDeadline] = useState("");
  const [proyectoAEditar, setProyectoAEditar] = useState<ProyectoType | null>(null);
  const [proyectoAEliminar, setProyectoAEliminar] = useState<string | null>(null);

  const proyectosFiltrados = Object.values(proyectos)
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      const totalA = Object.values(a.tareas).flat().length;
      const totalB = Object.values(b.tareas).flat().length;
      const compA = a.tareas["completado"]?.length || 0;
      const compB = b.tareas["completado"]?.length || 0;
      switch (orden) {
        case "recientes": return parseInt(b.id) - parseInt(a.id);
        case "antiguos": return parseInt(a.id) - parseInt(b.id);
        case "alfabetico": return a.nombre.localeCompare(b.nombre);
        case "progreso": return (compB / totalB || 0) - (compA / totalA || 0);
        default: return 0;
      }
    });

  const handleCrearProyecto = (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    agregarProyecto(email, nuevoNombre.trim(), nuevaDescripcion.trim(), nuevoColor, nuevoDeadline || null);
    setNuevoNombre("");
    setNuevaDescripcion("");
    setNuevoColor("#3B82F6");
    setNuevoDeadline("");
    setMostrarModal(false);
  };

  const handleEditarProyecto = (e: FormEvent) => {
    e.preventDefault();
    if (!proyectoAEditar) return;
    editarProyecto(proyectoAEditar.id, nuevoNombre, nuevaDescripcion, nuevoColor, nuevoDeadline || null);
    setProyectoAEditar(null);
  };

  const confirmarEliminar = () => {
    if (proyectoAEliminar) eliminarProyecto(proyectoAEliminar);
    setProyectoAEliminar(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Tus Proyectos</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center justify-center p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text font-semibold"
        >
           Nuevo Proyecto
        </button>
        <input
          type="text"
          value={busqueda}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
          placeholder="Buscar proyectos..."
          className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded"
        />
        <select
          value={orden}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setOrden(e.target.value)}
          className="w-full sm:w-1/4 px-3 py-2 border border-gray-300 rounded"
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
          <option value="alfabetico">Alfabéticamente</option>
          <option value="progreso">Mayor progreso</option>
        </select>
      </div>

      {/* === REEMPLAZO: Grid -> Tabla responsiva === */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        {proyectosFiltrados.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">Listado de proyectos</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proyecto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progreso</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tareas</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deadline</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Color</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proyectosFiltrados.map((proyecto) => {
                const total = Object.values(proyecto.tareas).flat().length;
                const done = proyecto.tareas["completado"]?.length || 0;
                const progreso = total ? Math.round((done / total) * 100) : 0;

                const deadlineClass = proyecto.deadline
                  ? isBefore(parseISO(proyecto.deadline), new Date())
                    ? "text-red-600"
                    : differenceInDays(parseISO(proyecto.deadline), new Date()) <= 3
                    ? "text-orange-500"
                    : "text-gray-700"
                  : "text-gray-400";

                return (
                  <tr key={proyecto.id} className="hover:bg-gray-50">
                    {/* Proyecto con Link al detalle (mantiene la navegación) */}
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <Link
                        to={`/proyecto/${proyecto.id}`}
                        className="font-medium text-gray-900 hover:underline"
                        title="Ver detalle del proyecto"
                      >
                        {proyecto.nombre}
                      </Link>
                    </td>

                    {/* Descripción */}
                    <td className="px-4 py-3 align-top text-sm text-gray-600 max-w-[40ch] truncate">{proyecto.descripcion}</td>

                    {/* Progreso con barra + porcentaje */}
                    <td className="px-4 py-3 align-top w-56">
                      <div className="w-full bg-gray-200 h-2 rounded">
                        <div
                          className="h-2 rounded bg-green-500"
                          style={{ width: `${progreso}%` }}
                          aria-valuenow={progreso}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          role="progressbar"
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-600">{progreso}%</div>
                    </td>

                    {/* Tareas completadas / total */}
                    <td className="px-4 py-3 align-top text-sm text-gray-700 whitespace-nowrap">{done}/{total}</td>

                    {/* Deadline con mismo esquema de colores */}
                    <td className={`px-4 py-3 align-top text-sm whitespace-nowrap ${deadlineClass}`}>
                      {proyecto.deadline ? `📅 ${proyecto.deadline}` : "—"}
                    </td>

                    {/* Color en columna dedicada (swatch + hex) */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-5 h-5 rounded-full border border-gray-200 shadow-sm"
                          style={{ backgroundColor: proyecto.color }}
                          aria-label={`Color ${proyecto.color}`}
                          title={proyecto.color}
                        />
                        <code className="text-xs text-gray-700">{proyecto.color}</code>
                      </div>
                    </td>

                    {/* Acciones Editar / Eliminar (mismas funciones) */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setProyectoAEditar(proyecto);
                            setNuevoNombre(proyecto.nombre);
                            setNuevaDescripcion(proyecto.descripcion);
                            setNuevoColor(proyecto.color);
                            setNuevoDeadline(proyecto.deadline || "");
                          }}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                          title="Editar proyecto"
                          aria-label={`Editar ${proyecto.nombre}`}
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setProyectoAEliminar(proyecto.id);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                          title="Eliminar proyecto"
                          aria-label={`Eliminar ${proyecto.nombre}`}
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
          <div className="p-6 text-center text-gray-500">No se encontraron proyectos. ¡Crea uno para comenzar!</div>
        )}
      </div>

      {mostrarModal && (
        <ModalCrearProyecto
          nuevoNombre={nuevoNombre}
          nuevaDescripcion={nuevaDescripcion}
          nuevoColor={nuevoColor}
          nuevoDeadline={nuevoDeadline}
          onChangeNombre={setNuevoNombre}
          onChangeDescripcion={setNuevaDescripcion}
          onChangeColor={setNuevoColor}
          onChangeDeadline={setNuevoDeadline}
          onClose={() => setMostrarModal(false)}
          onSubmit={handleCrearProyecto}
        />
      )}

      {proyectoAEditar && (
        <ModalEditarProyecto
          nuevoNombre={nuevoNombre}
          nuevaDescripcion={nuevaDescripcion}
          nuevoColor={nuevoColor}
          nuevoDeadline={nuevoDeadline}
          onChangeNombre={setNuevoNombre}
          onChangeDescripcion={setNuevaDescripcion}
          onChangeColor={setNuevoColor}
          onChangeDeadline={setNuevoDeadline}
          onClose={() => setProyectoAEditar(null)}
          onSubmit={handleEditarProyecto}
        />
      )}

      {proyectoAEliminar && (
        <ModalEliminarProyecto
          onClose={() => setProyectoAEliminar(null)}
          onConfirm={confirmarEliminar}
        />
      )}
    </div>
  );
}
