const proyectos = [
  { id: "1", nombre: "Landing Page", descripcion: "Diseño de sitio institucional" },
  { id: "2", nombre: "Tienda Online", descripcion: "App de e-commerce" },
  { id: "3", nombre: "Panel de Tareas", descripcion: "Tipo Trello" },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tus Proyectos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {proyectos.map((proyecto) => (
          <a
            key={proyecto.id}
            href={`/proyecto/${proyecto.id}`}
            className="block p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{proyecto.nombre}</h2>
            <p className="text-sm text-gray-500">{proyecto.descripcion}</p>
          </a>
        ))}

        {/* Tarjeta para crear nuevo proyecto */}
        <button className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          Nuevo Proyecto
        </button>
      </div>
    </div>
  );
}

  