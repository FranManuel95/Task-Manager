import { create } from "zustand";
import { persist } from "zustand/middleware";
export type Estado = "por-hacer" | "en-progreso" | "completado";
export type Prioridad = "alta" | "media" | "baja";

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  deadline?: string | null;
  etiquetas: string[];
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  deadline: string | null;
  tareas: Record<Estado, Tarea[]>;
  usuarios: string[]; // ✅ Soporte colaborativo
}

export interface TareasStore {
  usuarioActual: string | null;
  setUsuarioActual: (email: string) => void;

  proyectos: Record<string, Record<string, Proyecto>>;

  searchTerm: string;
  filterPrioridad: string;
  setSearchTerm: (term: string) => void;
  setFilterPrioridad: (prioridad: string) => void;

  getProyectosPorUsuario: (email: string) => Record<string, Proyecto>;
  getProyectoPorId: (email: string, id: string) => Proyecto | null;

  agregarProyecto: (
    email: string,
    nombre: string,
    descripcion?: string,
    color?: string,
    deadline?: string | null
  ) => void;

  editarProyecto: (
    id: string,
    nombre: string,
    descripcion: string,
    color: string,
    deadline: string | null
  ) => void;

  eliminarProyecto: (id: string) => void;

  agregarTarea: (
    proyectoId: string,
    estado: Estado,
    titulo: string,
    deadline?: string | null
  ) => void;

  editarTarea: (
    proyectoId: string,
    columnaId: Estado,
    tareaId: string,
    nuevoTitulo: string,
    nuevaDescripcion: string,
    prioridad: Prioridad,
    deadline: string | null,
    etiquetas: string[]
  ) => void;
    agregarColaborador: (proyectoId: string, nuevoEmail: string) => void;
   

  eliminarTarea: (proyectoId: string, estado: Estado, id: string) => void;

  moverTarea: (proyectoId: string, tareaId: string, destino: Estado) => void;
}

export const useTareasStore = create<TareasStore>()(
  
  persist(
    (set, get) => ({
      usuarioActual: null,
      setUsuarioActual: (email) => set({ usuarioActual: email }),

      proyectos: {
        "demo@email.com": {
          "1": {
            id: "1",
            nombre: "Landing Page",
            descripcion: "Diseño de sitio institucional",
            color: "#3B82F6",
            deadline: null,
            usuarios: ["demo@email.com"],
            tareas: {
              "por-hacer": [],
              "en-progreso": [],
              "completado": [],
            },
          },
        },
      },

      searchTerm: "",
      filterPrioridad: "todas",
      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterPrioridad: (prioridad) => set({ filterPrioridad: prioridad }),

      getProyectosPorUsuario: (email) => {
        const todos = get().proyectos;
        const resultado: Record<string, Proyecto> = {};

        for (const usuario of Object.keys(todos)) {
          for (const [id, proyecto] of Object.entries(todos[usuario])) {
            if (proyecto.usuarios?.includes(email)) {
              resultado[id] = proyecto;
            }
          }
        }

        return resultado;
      },

      getProyectoPorId: (email, id) => {
        const todos = get().proyectos;
        for (const usuario of Object.keys(todos)) {
          const proyecto = todos[usuario][id];
          if (proyecto?.usuarios.includes(email)) return proyecto;
        }
        return null;
      },

      agregarProyecto: (
        email,
        nombre,
        descripcion,
        color,
        deadline
      ) => {
        const nuevoProyecto: Proyecto = {
          id: Date.now().toString(),
          nombre,
          descripcion: descripcion ?? "",
          color: color ?? "#3B82F6",
          deadline: deadline ?? null,
          usuarios: [email], // 👈 Colaborador
          tareas: {
            "por-hacer": [],
            "en-progreso": [],
            "completado": [],
          },
        };

        const proyectosActuales = get().proyectos[email] || {};
        const nuevosProyectosUsuario = {
          ...proyectosActuales,
          [nuevoProyecto.id]: nuevoProyecto,
        };
        set({
          proyectos: {
            ...get().proyectos,
            [email]: nuevosProyectosUsuario,
          },
        });
      },

      editarProyecto: (id, nombre, descripcion, color, deadline) => {
        const email = get().usuarioActual;
        if (!email) return;

        const proyecto = get().proyectos[email]?.[id];
        if (!proyecto) return;

        if (deadline) {
          for (const columna of Object.values(proyecto.tareas)) {
            for (const tarea of columna) {
              if (tarea.deadline && new Date(tarea.deadline) > new Date(deadline)) {
                alert("El proyecto tiene tareas con fecha posterior a la nueva fecha límite.");
                return;
              }
            }
          }
        }

        set((state) => ({
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
        }));
      },

      eliminarProyecto: (id) => {
        const email = get().usuarioActual;
        if (!email) return;

        set((state) => {
          const nuevosProyectos = { ...state.proyectos[email] };
          delete nuevosProyectos[id];
          return {
            proyectos: {
              ...state.proyectos,
              [email]: nuevosProyectos,
            },
          };
        });
      },

      agregarTarea: (proyectoId, estado, titulo, deadline = null) => {
        const email = get().usuarioActual;
        if (!email) return;

        const proyecto = get().getProyectoPorId(email, proyectoId);
        if (!proyecto) return;

        if (deadline && proyecto.deadline && new Date(deadline) > new Date(proyecto.deadline)) {
          alert("La fecha de la tarea no puede superar la fecha límite del proyecto");
          return;
        }

        const nuevaTarea: Tarea = {
          id: Date.now().toString(),
          titulo,
          descripcion: "",
          prioridad: "media",
          deadline,
          etiquetas: [],
        };

        set((state) => {
          const nuevasTareas = {
            ...proyecto.tareas,
            [estado]: [...proyecto.tareas[estado], nuevaTarea],
          };

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
        });
      },

      editarTarea: (
        proyectoId,
        columnaId,
        tareaId,
        nuevoTitulo,
        nuevaDescripcion,
        prioridad,
        deadline,
        etiquetas
      ) => {
        const email = get().usuarioActual;
        if (!email) return;

        const proyecto = get().getProyectoPorId(email, proyectoId);
        if (!proyecto) return;

        if (deadline && proyecto.deadline && new Date(deadline) > new Date(proyecto.deadline)) {
          alert("La fecha de la tarea no puede superar la fecha límite del proyecto");
          return;
        }

        const nuevasTareas = {
          ...proyecto.tareas,
          [columnaId]: proyecto.tareas[columnaId].map((t) =>
            t.id === tareaId
              ? { ...t, titulo: nuevoTitulo, descripcion: nuevaDescripcion, prioridad, deadline, etiquetas }
              : t
          ),
        };

        set((state) => ({
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
        }));
      },

      eliminarTarea: (proyectoId, estado, id) => {
        const email = get().usuarioActual;
        if (!email) return;

        const proyecto = get().getProyectoPorId(email, proyectoId);
        if (!proyecto) return;

        set((state) => {
          const nuevasTareas = {
            ...proyecto.tareas,
            [estado]: proyecto.tareas[estado].filter((t) => t.id !== id),
          };

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
        });
      },
      agregarColaborador: (proyectoId: string, nuevoEmail: string) => {
  const email = get().usuarioActual;
  if (!email) return;

  const proyectos = get().proyectos;
  for (const usuario in proyectos) {
    const proyecto = proyectos[usuario][proyectoId];
    if (proyecto && proyecto.usuarios.includes(email)) {
      if (!proyecto.usuarios.includes(nuevoEmail)) {
        proyecto.usuarios.push(nuevoEmail);
        set({ proyectos: { ...proyectos } });
      }
      return;
    }
  }
},


      moverTarea: (proyectoId, tareaId, destino) => {
        const email = get().usuarioActual;
        if (!email) return;

        const proyecto = get().getProyectoPorId(email, proyectoId);
        if (!proyecto) return;

        const nuevasTareas: Record<Estado, Tarea[]> = { ...proyecto.tareas };
        let tareaMovida: Tarea | null = null;

        (Object.keys(nuevasTareas) as Estado[]).forEach((key) => {
          const index = nuevasTareas[key].findIndex((t) => t.id === tareaId);
          if (index !== -1) {
            tareaMovida = nuevasTareas[key][index];
            nuevasTareas[key].splice(index, 1);
          }
        });

        if (tareaMovida) {
          nuevasTareas[destino].push(tareaMovida);
        }

        set((state) => ({
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
        }));
      },
    }),
    {
      name: "tareas-storage",
    }
  )
);
