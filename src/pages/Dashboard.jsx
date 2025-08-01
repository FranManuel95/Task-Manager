import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTareasStore } from "../store/tareasStore";

export default function Dashboard() {
  const proyectos = useTareasStore((state) => state.proyectos);
  const agregarProyecto = useTareasStore((state) => state.agregarProyecto);
  const eliminarProyecto = useTareasStore((state) => state.eliminarProyecto);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [orden, setOrden] = useState("recientes");
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

    const [nuevoColor, setNuevoColor] = useState("#3B82F6");

    const handleCrearProyecto = (e) => {
      e.preventDefault();
      const nombreLimpio = nuevoNombre.trim();
      if (!nombreLimpio) return;
      agregarProyecto(nombreLimpio, nuevaDescripcion.trim(), nuevoColor);
      setNuevoNombre("");
      setNuevaDescripcion("");
      setNuevoColor("#3B82F6");
      setMostrarModal(false);
    };
    

  const confirmarEliminar = () => {
    if (proyectoAEliminar) {
      eliminarProyecto(proyectoAEliminar);
      setProyectoAEliminar(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tus Proyectos</h1>

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

                {/* Botón eliminar */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setProyectoAEliminar(proyecto.id);
                  }}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-sm"
                  title="Eliminar proyecto"
                >
                  ✕
                </button>
              </Link>
            );
          })
        ) : (
          <p className="col-span-full text-gray-500 text-center">
            No se encontraron proyectos. ¡Crea uno para comenzar!
          </p>
        )}
      </div>

      {/* Modal de confirmación */}
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
              <h2 className="text-xl font-bold mb-4 text-red-600">Eliminar proyecto</h2>
              <p className="mb-4 text-gray-700">
                ¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.
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
            <label className="block text-sm font-medium text-gray-700">
              Color del proyecto
            </label>
            <input
              type="color"
              value={nuevoColor}
              onChange={(e) => setNuevoColor(e.target.value)}
              className="w-16 h-10 cursor-pointer"
            />
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}
