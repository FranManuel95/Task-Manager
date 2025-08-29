// src/__tests__/setupStoreForTest.ts
import { useTareasStore, Tarea, Estado, Prioridad } from "../store/tareasStore";

export function setupStoreForTests() {
  const email = "test@example.com";
  const proyectoId = "test-proyecto";

  const tareaEjemplo: Tarea = {
    id: "1",
    titulo: "Tarea Test",
    descripcion: "",
    prioridad: "media",
    deadline: null,
    etiquetas: [],
  };

  useTareasStore.setState((state) => ({
    usuarioActual: email,
    proyectos: {
      ...state.proyectos,
      [email]: {
        [proyectoId]: {
          id: proyectoId,
          nombre: "Proyecto de prueba",
          descripcion: "Un proyecto para testing",
          color: "#3B82F6",
          deadline: null,
          tareas: {
            "por-hacer": [tareaEjemplo],
            "en-progreso": [],
            completado: [],
          },
        },
      },
    },
    searchTerm: "",
    filterPrioridad: "todas",
  }));
}
