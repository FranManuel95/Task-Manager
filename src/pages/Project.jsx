import { useParams } from "react-router-dom";

const mockTareas = {
  "por-hacer": [
    { id: "t1", titulo: "Definir diseño" },
    { id: "t2", titulo: "Crear wireframes" },
  ],
  "en-progreso": [
    { id: "t3", titulo: "Desarrollar login" },
  ],
  "completado": [
    { id: "t4", titulo: "Configurar Tailwind" },
  ],
};

const estados = [
  { id: "por-hacer", titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado", titulo: "Completado" },
];

export default function Project() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Proyecto ID: {id}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {estados.map((estado) => (
          <div
            key={estado.id}
            className="bg-gray-100 p-4 rounded-xl shadow-inner min-h-[200px]"
          >
            <h2 className="text-lg font-semibold mb-4">{estado.titulo}</h2>

            <div className="space-y-2">
              {mockTareas[estado.id].map((tarea) => (
                <div
                  key={tarea.id}
                  className="bg-white p-3 rounded-lg shadow hover:bg-gray-50"
                >
                  {tarea.titulo}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
