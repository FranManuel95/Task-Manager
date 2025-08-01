import { Link } from "react-router-dom";
import { useTareasStore } from "../store/tareasStore";

export default function Dashboard() {
  const proyectos = useTareasStore((state) => state.proyectos);
  const agregarProyecto = useTareasStore((state) => state.agregarProyecto);
  const eliminarProyecto = useTareasStore((state) => state.eliminarProyecto);

  const proyectosOrdenados = Object.values(proyectos).sort(
    (a, b) => parseInt(b.id) - parseInt(a.id)
  );

  const handleNuevoProyecto = () => {
    const nuevoNombre = `Proyecto ${Object.keys(proyectos).length + 1}`;
    agregarProyecto(nuevoNombre, "Descripción opcional");
  };

  const handleEliminar = (e, id) => {
    e.preventDefault(); // para que no navegue al link
    if (window.confirm("¿Seguro que deseas eliminar este proyecto?")) {
      eliminarProyecto(id);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tus Proyectos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <button
          onClick={handleNuevoProyecto}
          className="flex items-center justify-center p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-lg font-semibold"
        >
          + Nuevo Proyecto
        </button>

        {proyectosOrdenados.length > 0 ? (
          proyectosOrdenados.map((proyecto) => (
            <Link
              key={proyecto.id}
              to={`/proyecto/${proyecto.id}`}
              className="relative block p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold">{proyecto.nombre}</h2>
              <p className="text-sm text-gray-500">{proyecto.descripcion}</p>

              {/* Botón eliminar */}
              <button
                onClick={(e) => handleEliminar(e, proyecto.id)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-sm"
                title="Eliminar proyecto"
              >
                ✕
              </button>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-gray-500 text-center">
            Aún no tienes proyectos. ¡Crea uno para comenzar!
          </p>
        )}
      </div>
    </div>
  );
}
