import { TareasStore } from "./tareas.types";
import { Proyecto } from "@/types";

export const createProyectoActions = (set: any, get: () => TareasStore) => ({
  getProyectosPorUsuario: (email: string): Record<string, Proyecto> => {
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

  getProyectoPorId: (email: string, id: string): Proyecto | null => {
    const todos = get().proyectos;
    for (const usuario of Object.keys(todos)) {
      const proyecto = todos[usuario][id];
      if (proyecto?.usuarios.includes(email)) return proyecto;
    }
    return null;
  },

  agregarProyecto: (
    email: string,
    nombre: string,
    descripcion?: string,
    color?: string,
    deadline?: string | null
  ) => {
    const nuevoProyecto: Proyecto = {
      id: Date.now().toString(),
      nombre,
      descripcion: descripcion ?? "",
      color: color ?? "#3B82F6",
      deadline: deadline ?? null,
      creadoPor: email,
      usuarios: [email],
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

  editarProyecto: (
    id: string,
    nombre: string,
    descripcion: string,
    color: string,
    deadline: string | null
  ) => {
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

    set((state: TareasStore) => ({
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

  eliminarProyecto: (id: string) => {
    const email = get().usuarioActual;
    if (!email) return;

    set((state: TareasStore) => {
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
});
