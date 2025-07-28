import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTareasStore = create(
  persist(
    (set) => ({
      tareas: {
        "por-hacer": [
          { id: "t1", titulo: "Diseñar el logo", descripcion: "", prioridad: "media" },
          { id: "t2", titulo: "Crear wireframes", descripcion: "", prioridad: "baja" },
        ],
        "en-progreso": [
          { id: "t3", titulo: "Implementar login", descripcion: "", prioridad: "alta" },
        ],
        "completado": [
          { id: "t4", titulo: "Configurar Tailwind", descripcion: "", prioridad: "media" },
        ],
      },

      // 🔎 filtros
      searchTerm: "",
      filterPrioridad: "todas",

      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterPrioridad: (prioridad) => set({ filterPrioridad: prioridad }),

      agregarTarea: (estadoId, titulo) =>
        set((state) => {
          const nuevaTarea = {
            id: `t${Date.now()}`,
            titulo,
            descripcion: "",
            prioridad: "media",
          };
          return {
            tareas: {
              ...state.tareas,
              [estadoId]: [...state.tareas[estadoId], nuevaTarea],
            },
          };
        }),

      eliminarTarea: (estadoId, tareaId) =>
        set((state) => ({
          tareas: {
            ...state.tareas,
            [estadoId]: state.tareas[estadoId].filter((t) => t.id !== tareaId),
          },
        })),

      moverTarea: (tareaId, destinoId) =>
        set((state) => {
          const nuevaTareas = { ...state.tareas };
          let tareaMovida = null;

          for (const estado in nuevaTareas) {
            const tareasFiltradas = nuevaTareas[estado].filter((t) => {
              if (t.id === tareaId) {
                tareaMovida = t;
                return false;
              }
              return true;
            });
            nuevaTareas[estado] = [...tareasFiltradas];
          }

          if (tareaMovida) {
            nuevaTareas[destinoId] = [...nuevaTareas[destinoId], tareaMovida];
          }

          return { tareas: { ...nuevaTareas } };
        }),

      editarTarea: (estadoId, tareaId, nuevoTitulo, nuevaDescripcion, nuevaPrioridad) =>
        set((state) => ({
          tareas: {
            ...state.tareas,
            [estadoId]: state.tareas[estadoId].map((t) =>
              t.id === tareaId
                ? {
                    ...t,
                    titulo: nuevoTitulo ?? t.titulo,
                    descripcion: nuevaDescripcion ?? t.descripcion,
                    prioridad: nuevaPrioridad ?? t.prioridad,
                  }
                : t
            ),
          },
        })),
    }),
    { name: "task-manager-storage" }
  )
);
