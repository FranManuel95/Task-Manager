// store/tareasStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTareasStore = create(
  persist(
    (set) => ({
      proyectos: {
        "1": {
          id: "1",
          nombre: "Landing Page",
          descripcion: "Diseño de sitio institucional",
          tareas: {
            "por-hacer": [],
            "en-progreso": [],
            "completado": [],
          },
        },
      },

      searchTerm: "",
      filterPrioridad: "todas",

      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterPrioridad: (prioridad) => set({ filterPrioridad: prioridad }),

      agregarProyecto: (nombre, descripcion = "") =>
        set((state) => {
          const nuevoId = Date.now().toString();
          return {
            proyectos: {
              ...state.proyectos,
              [nuevoId]: {
                id: nuevoId,
                nombre,
                descripcion,
                tareas: {
                  "por-hacer": [],
                  "en-progreso": [],
                  "completado": [],
                },
              },
            },
          };
        }),

      agregarTarea: (proyectoId, estado, titulo) =>
        set((state) => {
          const proyecto = state.proyectos[proyectoId];
          if (!proyecto) return state;

          return {
            proyectos: {
              ...state.proyectos,
              [proyectoId]: {
                ...proyecto,
                tareas: {
                  ...proyecto.tareas,
                  [estado]: [
                    ...proyecto.tareas[estado],
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
              },
            },
          };
        }),

      eliminarTarea: (proyectoId, estado, id) =>
        set((state) => {
          const proyecto = state.proyectos[proyectoId];
          if (!proyecto) return state;

          return {
            proyectos: {
              ...state.proyectos,
              [proyectoId]: {
                ...proyecto,
                tareas: {
                  ...proyecto.tareas,
                  [estado]: proyecto.tareas[estado].filter((t) => t.id !== id),
                },
              },
            },
          };
        }),

      moverTarea: (proyectoId, tareaId, destino) =>
        set((state) => {
          const proyecto = state.proyectos[proyectoId];
          if (!proyecto) return state;

          const nuevasTareas = { ...proyecto.tareas };
          let tareaMovida = null;

          for (const key in nuevasTareas) {
            const index = nuevasTareas[key].findIndex((t) => t.id === tareaId);
            if (index !== -1) {
              tareaMovida = nuevasTareas[key][index];
              nuevasTareas[key].splice(index, 1);
              break;
            }
          }

          if (tareaMovida) {
            nuevasTareas[destino].push(tareaMovida);
          }

          return {
            proyectos: {
              ...state.proyectos,
              [proyectoId]: {
                ...proyecto,
                tareas: nuevasTareas,
              },
            },
          };
        }),

      editarTarea: (
        proyectoId,
        columnaId,
        tareaId,
        nuevoTitulo,
        nuevaDescripcion,
        prioridad,
        deadline,
        etiquetas
      ) =>
        set((state) => {
          const proyecto = state.proyectos[proyectoId];
          if (!proyecto) return state;

          const nuevasTareas = { ...proyecto.tareas };
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

          return {
            proyectos: {
              ...state.proyectos,
              [proyectoId]: {
                ...proyecto,
                tareas: nuevasTareas,
              },
            },
          };
        }),
    }),
    { name: "tareas-storage" }
  )
);
