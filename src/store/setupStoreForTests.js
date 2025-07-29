// src/__tests__/setupStoreForTests.js
import { useTareasStore } from "./tareasStore";

export function setupStore(initialState = {}) {
  useTareasStore.setState({
    tareas: {
      "por-hacer": [
        { id: "1", titulo: "Tarea Test", descripcion: "", prioridad: "media" },
      ],
      "en-progreso": [],
      completado: [],
    },
    agregarTarea: (columna, titulo) =>
      useTareasStore.setState((state) => ({
        tareas: {
          ...state.tareas,
          [columna]: [
            ...state.tareas[columna],
            { id: Date.now().toString(), titulo, descripcion: "", prioridad: "media" },
          ],
        },
      })),
    eliminarTarea: (columna, id) =>
      useTareasStore.setState((state) => ({
        tareas: {
          ...state.tareas,
          [columna]: state.tareas[columna].filter((t) => t.id !== id),
        },
      })),
    moverTarea: (id, destino) =>
      useTareasStore.setState((state) => {
        const origen = Object.keys(state.tareas).find((col) =>
          state.tareas[col].some((t) => t.id === id)
        );
        if (!origen) return state;
        const tarea = state.tareas[origen].find((t) => t.id === id);
        return {
          tareas: {
            ...state.tareas,
            [origen]: state.tareas[origen].filter((t) => t.id !== id),
            [destino]: [...state.tareas[destino], tarea],
          },
        };
      }),
    editarTarea: (columna, id, titulo, descripcion, prioridad) =>
      useTareasStore.setState((state) => ({
        tareas: {
          ...state.tareas,
          [columna]: state.tareas[columna].map((t) =>
            t.id === id ? { ...t, titulo, descripcion, prioridad } : t
          ),
        },
      })),
    searchTerm: "",
    filterPrioridad: "todas",
    setSearchTerm: (term) => useTareasStore.setState({ searchTerm: term }),
    setFilterPrioridad: (prio) => useTareasStore.setState({ filterPrioridad: prio }),
    ...initialState,
  });
}
