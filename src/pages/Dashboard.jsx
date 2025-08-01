import { Link } from "react-router-dom";
import { useState } from "react";
import { useTareasStore } from "../store/tareasStore";

export default function Dashboard() {
  const proyectos = useTareasStore((state) => state.proyectos);
  const agregarProyecto = useTareasStore((state) => state.agregarProyecto);
  const eliminarProyecto = useTareasStore((state) => state.eliminarProyecto);

  const [busqueda, setBusqueda] = useState("");

  const proyectosFiltrados = Object.values(proyectos).filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleNuevoProyecto = () => {
    const nuevoNombre = `Proyecto ${Object.keys(proyectos).length + 1}`;
    agregarProyecto(nuevoNombre, "Descripción opcional");
  };

  const handleEliminar = (e, id) => {
    e.preventDefault(); // evita que el link se dispare
    if (window.confirm("¿Seguro que deseas eliminar este proyecto?")) {
      eliminarProyecto(id);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tus Proyectos</h1>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proyectos..."
          className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Botón para crear nuevo proyecto */}
        <button
          onClick={handleNuevoProyecto}
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
                className="relative block p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold">{proyecto.nombre}</h2>
                <p className="text-sm text-gray-500 mb-2">{proyecto.descripcion}</p>

                {/* Barra de progreso */}
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
                  onClick={(e) => handleEliminar(e, proyecto.id)}
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
    </div>
  );
}
