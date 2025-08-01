import { Link } from "react-router-dom";
import { useTareasStore } from "../store/tareasStore";

export default function Dashboard() {
  const proyectos = useTareasStore((state) => state.proyectos);
  const agregarProyecto = useTareasStore((state) => state.agregarProyecto);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tus Proyectos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Object.values(proyectos).map((proyecto) => (
          <Link
            key={proyecto.id}
            to={`/proyecto/${proyecto.id}`}
            className="block p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{proyecto.nombre}</h2>
            <p className="text-sm text-gray-500">{proyecto.descripcion}</p>
          </Link>
        ))}

        {/* Tarjeta para crear nuevo proyecto */}
        <button
          onClick={() =>
            agregarProyecto(`Proyecto ${Object.keys(proyectos).length + 1}`, "Descripción opcional")
          }
          className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Nuevo Proyecto
        </button>
      </div>
    </div>
  );
}
