import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTareasStore = create(
  persist(
    (set, get) => ({
      usuarioActual: null,
      setUsuarioActual: (email) => set({ usuarioActual: email }),

      proyectos: {
        // ejemplo inicial (puedes borrar si quieres empezar limpio)
        "demo@email.com": {
          "1": {
            id: "1",
            nombre: "Landing Page",
            descripcion: "Diseño de sitio institucional",
            color: "#3B82F6",
            deadline: null,
            tareas: {
              "por-hacer": [],
              "en-progreso": [],
              "completado": []
            }
          }
        }
      },

      searchTerm: "",
      filterPrioridad: "todas",

      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterPrioridad: (prioridad) => set({ filterPrioridad: prioridad }),

      getProyectosPorUsuario: (email) => {
        const proyectos = get().proyectos || {};
        return proyectos[email] || {};
      },

      getProyectoPorId: (email, id) => {
  const proyectosDelUsuario = get().proyectos[email] || {};
  return proyectosDelUsuario[id] || null;
}
,

      agregarProyecto: (email, nombre, descripcion = "", color = "#3B82F6", deadline = null) =>
  set((state) => {
    const nuevoId = Date.now().toString();

    const proyectosDelUsuario = state.proyectos[email] || {};

    return {
      proyectos: {
        ...state.proyectos,
        [email]: {
          ...proyectosDelUsuario,
          [nuevoId]: {
            id: nuevoId,
            nombre,
            descripcion,
            color,
            deadline,
            tareas: {
              "por-hacer": [],
              "en-progreso": [],
              "completado": [],
            },
          },
        },
      },
    };
  }),


      editarProyecto: (id, nombre, descripcion, color, deadline) =>
        set((state) => {
          const email = get().usuarioActual;
          const proyecto = state.proyectos[email]?.[id];
          if (!proyecto) return state;

          // Validar fechas
          if (deadline && proyecto.tareas) {
            for (const columna of Object.values(proyecto.tareas)) {
              for (const tarea of columna) {
                if (tarea.deadline && new Date(tarea.deadline) > new Date(deadline)) {
                  alert("El proyecto tiene tareas con fecha posterior a la nueva fecha límite.");
                  return state;
                }
              }
            }
          }

          return {
            proyectos: {
              ...state.proyectos,
              [email]: {
                ...state.proyectos[email],
                [id]: {
                  ...proyecto,
                  nombre,
                  descripcion,
                  color,
                  deadline,
                },
              },
            },
          };
        }),

      eliminarProyecto: (id) =>
        set((state) => {
          const email = get().usuarioActual;
          const nuevosProyectos = { ...state.proyectos[email] };
          delete nuevosProyectos[id];
          return {
            proyectos: {
              ...state.proyectos,
              [email]: nuevosProyectos,
            },
          };
        }),

      agregarTarea: (proyectoId, estado, titulo, deadline = null) =>
        set((state) => {
          const email = get().usuarioActual;
          const proyecto = state.proyectos[email]?.[proyectoId];
          if (!proyecto) return state;

          if (deadline && proyecto.deadline && new Date(deadline) > new Date(proyecto.deadline)) {
            alert("La fecha de la tarea no puede superar la fecha límite del proyecto");
            return state;
          }

          return {
            proyectos: {
              ...state.proyectos,
              [email]: {
                ...state.proyectos[email],
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
                        deadline,
                        etiquetas: [],
                      },
                    ],
                  },
                },
              },
            },
          };
        }),

      editarTarea: (proyectoId, columnaId, tareaId, nuevoTitulo, nuevaDescripcion, prioridad, deadline, etiquetas) =>
        set((state) => {
          const email = get().usuarioActual;
          const proyecto = state.proyectos[email]?.[proyectoId];
          if (!proyecto) return state;

          if (deadline && proyecto.deadline && new Date(deadline) > new Date(proyecto.deadline)) {
            alert("La fecha de la tarea no puede superar la fecha límite del proyecto");
            return state;
          }

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
              [email]: {
                ...state.proyectos[email],
                [proyectoId]: { ...proyecto, tareas: nuevasTareas },
              },
            },
          };
        }),

      eliminarTarea: (proyectoId, estado, id) =>
        set((state) => {
          const email = get().usuarioActual;
          const proyecto = state.proyectos[email]?.[proyectoId];
          if (!proyecto) return state;

          return {
            proyectos: {
              ...state.proyectos,
              [email]: {
                ...state.proyectos[email],
                [proyectoId]: {
                  ...proyecto,
                  tareas: {
                    ...proyecto.tareas,
                    [estado]: proyecto.tareas[estado].filter((t) => t.id !== id),
                  },
                },
              },
            },
          };
        }),

      moverTarea: (proyectoId, tareaId, destino) =>
        set((state) => {
          const email = get().usuarioActual;
          const proyecto = state.proyectos[email]?.[proyectoId];
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
              [email]: {
                ...state.proyectos[email],
                [proyectoId]: {
                  ...proyecto,
                  tareas: nuevasTareas,
                },
              },
            },
          };
        }),
    }),
    {
      name: "tareas-storage",
    }
  )
);
