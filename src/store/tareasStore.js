// store/tareasStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTareasStore = create(
  persist(
    (set) => ({
      tareas: {
        "por-hacer": [
          {
            id: "1",
            titulo: "Tarea Test",
            descripcion: "",
            prioridad: "media",
            deadline: "2025-08-01",
            etiquetas: ["importante"],
          },
        ],
        "en-progreso": [],
        completado: [],
      },

      searchTerm: "",
      filterPrioridad: "todas",

      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterPrioridad: (prioridad) => set({ filterPrioridad: prioridad }),

      agregarTarea: (estado, titulo) =>
        set((state) => ({
          tareas: {
            ...state.tareas,
            [estado]: [
              ...state.tareas[estado],
              {
                id: Date.now().toString(),
                titulo,
                descripcion: "",
                prioridad: "media",
                deadline: null,
                etiquetas: [],
              },
            ],
          },
        })),

      eliminarTarea: (estado, id) =>
        set((state) => ({
          tareas: {
            ...state.tareas,
            [estado]: state.tareas[estado].filter((t) => t.id !== id),
          },
        })),

      moverTarea: (id, destino) =>
        set((state) => {
          let tareaMovida;
          const nuevasTareas = { ...state.tareas };

          for (const key in nuevasTareas) {
            const index = nuevasTareas[key].findIndex((t) => t.id === id);
            if (index !== -1) {
              tareaMovida = nuevasTareas[key][index];
              nuevasTareas[key].splice(index, 1);
              break;
            }
          }

          if (tareaMovida) {
            nuevasTareas[destino].push(tareaMovida);
          }

          return { tareas: nuevasTareas };
        }),

        editarTarea: (columnaId, tareaId, nuevoTitulo, nuevaDescripcion, prioridad, deadline, etiquetas) => {
            set((state) => {
              const nuevasTareas = { ...state.tareas };
              nuevasTareas[columnaId] = nuevasTareas[columnaId].map((t) =>
                t.id === tareaId
                  ? {
                      ...t,
                      titulo: nuevoTitulo,
                      descripcion: nuevaDescripcion,
                      prioridad,
                      deadline,
                      etiquetas,
                    }
                  : t
              );
              return { tareas: nuevasTareas };
            });
          },
          
    }),
    { name: "tareas-storage" }
  )
);
