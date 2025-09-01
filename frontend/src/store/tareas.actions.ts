// src/store/tareas.actions.ts
import { TareasStore } from "./tareas.types";
import { Prioridad, Tarea, Estado } from "../types";
import { validateTareaDeadline } from "./tareas.helpers";
import { locateProyecto, canEditProyecto } from "./proyectos.helpers";

export const createTareaActions = (set: any, get: () => TareasStore) => ({
  agregarTarea: (
    proyectoId: string,
    estado: Estado,
    titulo: string,
    deadline: string | null = null
  ): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    if (!validateTareaDeadline(deadline, proyecto.deadline)) return;

    const nuevaTarea: Tarea = {
      id: Date.now().toString(),
      titulo,
      descripcion: "",
      prioridad: "media",
      deadline,
      etiquetas: [],
    };

    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        [ownerEmail]: {
          ...state.proyectos[ownerEmail],
          [proyectoId]: {
            ...proyecto,
            tareas: {
              ...proyecto.tareas,
              [estado]: [...proyecto.tareas[estado], nuevaTarea],
            },
          },
        },
      },
    }));
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

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    if (!validateTareaDeadline(deadline, proyecto.deadline)) return;

    const nuevasTareasColumna = proyecto.tareas[columnaId].map((t) =>
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

    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        [ownerEmail]: {
          ...state.proyectos[ownerEmail],
          [proyectoId]: {
            ...proyecto,
            tareas: {
              ...proyecto.tareas,
              [columnaId]: nuevasTareasColumna,
            },
          },
        },
      },
    }));
  },

  eliminarTarea: (proyectoId: string, estado: Estado, id: string): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    const nuevasTareasColumna = proyecto.tareas[estado].filter((t) => t.id !== id);

    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        [ownerEmail]: {
          ...state.proyectos[ownerEmail],
          [proyectoId]: {
            ...proyecto,
            tareas: {
              ...proyecto.tareas,
              [estado]: nuevasTareasColumna,
            },
          },
        },
      },
    }));
  },

  moverTarea: (proyectoId: string, tareaId: string, destino: Estado): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    // Clonado inmutable de las columnas
    const nuevasTareas: Record<Estado, Tarea[]> = {
      "por-hacer": [...proyecto.tareas["por-hacer"]],
      "en-progreso": [...proyecto.tareas["en-progreso"]],
      "completado": [...proyecto.tareas["completado"]],
    };

    let tareaMovida: Tarea | null = null;

    (Object.keys(nuevasTareas) as Estado[]).forEach((key) => {
      const idx = nuevasTareas[key].findIndex((t) => t.id === tareaId);
      if (idx !== -1) {
        tareaMovida = nuevasTareas[key][idx];
        nuevasTareas[key] = [
          ...nuevasTareas[key].slice(0, idx),
          ...nuevasTareas[key].slice(idx + 1),
        ];
      }
    });

    if (tareaMovida) {
      nuevasTareas[destino] = [...nuevasTareas[destino], tareaMovida];
    }

    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        [ownerEmail]: {
          ...state.proyectos[ownerEmail],
          [proyectoId]: {
            ...proyecto,
            tareas: nuevasTareas,
          },
        },
      },
    }));
  },
});
