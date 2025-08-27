import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTareasStore } from "../store/tareasStore";
import { parseISO, differenceInDays, isBefore } from "date-fns";
import { useAuthStore } from "../store/authStore";



export default function Dashboard() {
  const email = useAuthStore((state) => state.usuario?.email);
  const setUsuarioActual = useTareasStore((state) => state.setUsuarioActual);
  useEffect(() => {
  if (email) {
    setUsuarioActual(email);
  }
}, [email, setUsuarioActual]);
const getProyectosPorUsuario = useTareasStore((state) => state.getProyectosPorUsuario);
const proyectos = getProyectosPorUsuario(email);
  const agregarProyecto = useTareasStore((state) => state.agregarProyecto);
  const editarProyecto = useTareasStore((state) => state.editarProyecto);
  const eliminarProyecto = useTareasStore((state) => state.eliminarProyecto);

  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#3B82F6");
  const [nuevoDeadline, setNuevoDeadline] = useState("");
  const [orden, setOrden] = useState("recientes");

  const [proyectoAEditar, setProyectoAEditar] = useState(null);
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);

  const proyectosFiltrados = Object.values(proyectos)
    .filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      const totalA = Object.values(a.tareas).flat().length;
      const totalB = Object.values(b.tareas).flat().length;
      const compA = a.tareas["completado"].length;
      const compB = b.tareas["completado"].length;

      switch (orden) {
        case "recientes":
          return parseInt(b.id) - parseInt(a.id);
        case "antiguos":
          return parseInt(a.id) - parseInt(b.id);
        case "alfabetico":
          return a.nombre.localeCompare(b.nombre);
        case "progreso": {
          const progresoA = totalA ? compA / totalA : 0;
          const progresoB = totalB ? compB / totalB : 0;
          return progresoB - progresoA;
        }
        default:
          return 0;
      }
    });

 const handleCrearProyecto = (e) => {
  e.preventDefault();
  const nombreLimpio = nuevoNombre.trim();
  if (!nombreLimpio) return;
  
  agregarProyecto(
    email, 
    nuevoNombre.trim(),
    nuevaDescripcion.trim(),
    nuevoColor,
    nuevoDeadline || null
  );

  setNuevoNombre("");
  setNuevaDescripcion("");
  setNuevoColor("#3B82F6");
  setNuevoDeadline("");
  setMostrarModal(false);
};


  const handleEditarProyecto = (e) => {
    e.preventDefault();
    if (!proyectoAEditar) return;

    editarProyecto(
      proyectoAEditar.id,
      nuevoNombre,
      nuevaDescripcion,
      nuevoColor,
      nuevoDeadline || null
    );
    setProyectoAEditar(null);
  };

  const confirmarEliminar = () => {
    if (proyectoAEliminar) {
      eliminarProyecto(proyectoAEliminar);
      setProyectoAEliminar(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
    <h1 className="text-3xl font-bold">Tus Proyectos</h1>
    <div className="text-right text-sm">
      <p>👤 {usuario?.email}</p>
      <button
        onClick={logout}
        className="text-red-500 hover:underline mt-1"
      >
        Cerrar sesión
      </button>
    </div>
  </div>

      {/* Barra de búsqueda y ordenamiento */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proyectos..."
          className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded"
        />
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="w-full sm:w-1/4 px-3 py-2 border border-gray-300 rounded"
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
          <option value="alfabetico">Alfabéticamente</option>
          <option value="progreso">Mayor progreso</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Botón para abrir modal de creación */}
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center justify-center p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-lg font-semibold"
        >
          + Nuevo Proyecto
        </button>

        {/* Lista de proyectos */}
        {proyectosFiltrados.length > 0 ? (
          proyectosFiltrados.map((proyecto) => {
            const totalTareas = Object.values(proyecto.tareas).flat().length;
            const completadas = proyecto.tareas["completado"].length;
            const progreso = totalTareas
              ? Math.round((completadas / totalTareas) * 100)
              : 0;

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
                  <div
                    className="bg-green-500 h-2 rounded"
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {completadas}/{totalTareas} tareas completadas ({progreso}%)
                </p>

                {proyecto.deadline && (
                  <p
                    className={`text-xs mt-2 ${
                      isBefore(parseISO(proyecto.deadline), new Date())
                        ? "text-red-600"
                        : differenceInDays(parseISO(proyecto.deadline), new Date()) <= 3
                        ? "text-orange-500"
                        : "text-gray-600"
                    }`}
                  >
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
                  >
                    ✕
                  </button>
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

      {/* Modal de creación */}
      <AnimatePresence>
        {mostrarModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-4">Crear nuevo proyecto</h2>
              <form onSubmit={handleCrearProyecto} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre del proyecto"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <label className="block text-sm font-medium text-gray-700">
                  Color del proyecto
                </label>
                <input
                  type="color"
                  value={nuevoColor}
                  onChange={(e) => setNuevoColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de entrega
                </label>
                <input
                  type="date"
                  value={nuevoDeadline}
                  onChange={(e) => setNuevoDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de edición */}
      <AnimatePresence>
        {proyectoAEditar && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-4">Editar proyecto</h2>
              <form onSubmit={handleEditarProyecto} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre del proyecto"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
                <textarea
                  placeholder="Descripción"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <label className="block text-sm font-medium text-gray-700">
                  Color del proyecto
                </label>
                <input
                  type="color"
                  value={nuevoColor}
                  onChange={(e) => setNuevoColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de entrega
                </label>
                <input
                  type="date"
                  value={nuevoDeadline}
                  onChange={(e) => setNuevoDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProyectoAEditar(null)}
                    className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {proyectoAEliminar && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-4 text-red-600">
                Eliminar proyecto
              </h2>
              <p className="mb-4 text-gray-700">
                ¿Seguro que deseas eliminar este proyecto? Esta acción no se puede
                deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setProyectoAEliminar(null)}
                  className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminar}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
