import { Estado, TareasStore } from "./tareas.types";
import { Prioridad, Tarea } from "../types/tarea";
import { validateTareaDeadline } from "./tareas.helpers";

export const createTareaActions = (set: any, get: () => TareasStore) => ({
  agregarTarea: (
    proyectoId: string,
    estado: Estado,
    titulo: string,
    deadline: string | null = null
  ): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const proyecto = get().getProyectoPorId(email, proyectoId);
    if (!proyecto) return;

    if (!validateTareaDeadline(deadline, proyecto.deadline)) return;

    const nuevaTarea: Tarea = {
      id: Date.now().toString(),
      titulo,
      descripcion: "",
      prioridad: "media",
      deadline,
      etiquetas: [],
    };

    set((state: TareasStore) => {
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
    proyectoId: string,
    columnaId: Estado,
    tareaId: string,
    nuevoTitulo: string,
    nuevaDescripcion: string,
    prioridad: Prioridad,
    deadline: string | null,
    etiquetas: string[]
  ): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const proyecto = get().getProyectoPorId(email, proyectoId);
    if (!proyecto) return;

    if (!validateTareaDeadline(deadline, proyecto.deadline)) return;

    const nuevasTareas = {
      ...proyecto.tareas,
      [columnaId]: proyecto.tareas[columnaId].map((t) =>
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
      ),
    };

    set((state: TareasStore) => ({
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

  eliminarTarea: (
    proyectoId: string,
    estado: Estado,
    id: string
  ): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const proyecto = get().getProyectoPorId(email, proyectoId);
    if (!proyecto) return;

    set((state: TareasStore) => {
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

  moverTarea: (
    proyectoId: string,
    tareaId: string,
    destino: Estado
  ): void => {
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

    set((state: TareasStore) => ({
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
});
