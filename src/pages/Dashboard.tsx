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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center justify-center p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-lg font-semibold"
        >
          + Nuevo Proyecto
        </button>

        {proyectosFiltrados.length > 0 ? (
          proyectosFiltrados.map((proyecto) => {
            const total = Object.values(proyecto.tareas).flat().length;
            const done = proyecto.tareas["completado"]?.length || 0;
            const progreso = total ? Math.round((done / total) * 100) : 0;
            return (
              <Link
                key={proyecto.id}
                to={`/proyecto/${proyecto.id}`}
                className="relative block p-4 bg-white rounded-xl shadow hover:shadow-lg transition border-4"
                style={{ borderColor: proyecto.color }}
              >
                <h2 className="text-xl font-semibold">{proyecto.nombre}</h2>
                <p className="text-sm text-gray-500 mb-2">{proyecto.descripcion}</p>
                <div className="w-full bg-gray-200 h-2 rounded mt-2">
                  <div className="bg-green-500 h-2 rounded" style={{ width: `${progreso}%` }}></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {done}/{total} tareas completadas ({progreso}%)
                </p>
                {proyecto.deadline && (
                  <p className={`text-xs mt-2 ${
                    isBefore(parseISO(proyecto.deadline), new Date())
                      ? "text-red-600"
                      : differenceInDays(parseISO(proyecto.deadline), new Date()) <= 3
                      ? "text-orange-500"
                      : "text-gray-600"
                  }`}>
                    📅 Fecha límite: {proyecto.deadline}
                  </p>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
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
                  >✎</button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setProyectoAEliminar(proyecto.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Eliminar proyecto"
                  >✕</button>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="col-span-full text-gray-500 text-center">
            No se encontraron proyectos. ¡Crea uno para comenzar!
          </p>
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
