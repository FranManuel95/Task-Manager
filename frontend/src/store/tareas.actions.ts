// src/store/tareas.actions.ts
import { TareasStore } from "./tareas.types";
import { Prioridad, Tarea, Estado } from "../types";
import { validateTareaDeadline } from "./tareas.helpers";
import { locateProyecto, canEditProyecto } from "./proyectos.helpers";
import { api } from "../services/api";

/** Helpers de normalización fuerte (evitan .trim de no-strings) */
function normTitle(input: unknown): string {
  return String(input ?? "").trim();
}
function normDesc(input: unknown): string {
  return String(input ?? "").trim();
}
function normPrioridad(p: unknown): Prioridad {
  return p === "alta" || p === "baja" ? (p as Prioridad) : "media";
}
function normDeadline(d: unknown): string | null {
  const v = d == null || d === "" ? null : String(d);
  return v;
}
function normEtiquetas(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean);
}

export const createTareaActions = (set: any, get: () => TareasStore) => ({
  agregarTarea: (
    proyectoId: string,
    estado: Estado,
    tituloInput: unknown,
    deadlineInput: unknown = null,
  ): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    // NORMALIZACIONES
    const titulo = normTitle(tituloInput);
    const deadline = normDeadline(deadlineInput);

    if (!titulo) return; // no crear tareas vacías

    if (!validateTareaDeadline(deadline, proyecto.deadline)) return;

    const tempId = `temp-${Date.now()}`;
    const nuevaTarea: Tarea = {
      id: tempId,
      titulo,
      descripcion: "",
      prioridad: "media",
      deadline,
      etiquetas: [],
    };

    // Optimista
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

    // Backend
    void (async () => {
      try {
        const created = await api.createTarea(proyectoId, estado, {
          titulo,
          descripcion: "",
          prioridad: "media",
          deadline,
          etiquetas: [],
        });

        // Reemplazar tempId por id real
        set((state: TareasStore) => {
          const loc2 = locateProyecto(state, proyectoId);
          if (!loc2) return state;

          const { ownerEmail: owner2, proyecto: p2 } = loc2;

          const replaceIn = (col: Tarea[]) =>
            col.map((t) => (t.id === tempId ? { ...created } : t));

          return {
            proyectos: {
              ...state.proyectos,
              [owner2]: {
                ...state.proyectos[owner2],
                [proyectoId]: {
                  ...p2,
                  tareas: {
                    ...p2.tareas,
                    "por-hacer": replaceIn(p2.tareas["por-hacer"]),
                    "en-progreso": replaceIn(p2.tareas["en-progreso"]),
                    completado: replaceIn(p2.tareas["completado"]),
                  },
                },
              },
            },
          };
        });
      } catch (err) {
        console.warn("createTarea falló, se mantiene estado local:", err);
      }
    })();
  },

  editarTarea: (
    proyectoId: string,
    columnaId: Estado,
    tareaId: string,
    nuevoTituloInput: unknown,
    nuevaDescripcionInput: unknown,
    prioridadInput: unknown,
    deadlineInput: unknown,
    etiquetasInput: unknown,
  ): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    // NORMALIZACIONES
    const nuevoTitulo = normTitle(nuevoTituloInput);
    const nuevaDescripcion = normDesc(nuevaDescripcionInput);
    const prioridad = normPrioridad(prioridadInput);
    const deadline = normDeadline(deadlineInput);
    const etiquetas = normEtiquetas(etiquetasInput);

    if (!validateTareaDeadline(deadline, proyecto.deadline)) return;

    const nuevasTareasColumna = proyecto.tareas[columnaId].map((t) =>
      t.id === tareaId
        ? {
            ...t,
            titulo: nuevoTitulo || t.titulo, // evita vaciar título
            descripcion: nuevaDescripcion,
            prioridad,
            deadline,
            etiquetas,
          }
        : t,
    );

    // Optimista
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

    // Backend
    void (async () => {
      try {
        await api.updateTarea(proyectoId, tareaId, {
          titulo: nuevoTitulo || undefined,
          descripcion: nuevaDescripcion,
          prioridad,
          deadline,
          etiquetas,
        });
      } catch (err) {
        console.warn("updateTarea falló, se mantiene estado local:", err);
      }
    })();
  },

  eliminarTarea: (proyectoId: string, estado: Estado, id: string): void => {
    const email = get().usuarioActual;
    if (!email) return;

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    const nuevasTareasColumna = proyecto.tareas[estado].filter(
      (t) => t.id !== id,
    );

    // Optimista
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

    // Backend
    void (async () => {
      try {
        await api.deleteTarea(proyectoId, id);
      } catch (err) {
        console.warn("deleteTarea falló:", err);
      }
    })();
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
      completado: [...proyecto.tareas["completado"]],
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

    // Optimista
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

    // Backend (si tu API devuelve el proyecto actualizado, lo aplicamos)
    void (async () => {
      try {
        const updatedProyecto = await api.moveTarea(proyectoId, {
          tareaId,
          from:
            (["por-hacer", "en-progreso", "completado"] as Estado[]).find((k) =>
              proyecto.tareas[k].some((t) => t.id === tareaId),
            ) ?? "por-hacer",
          to: destino,
        });
        set((state: TareasStore) => {
          const loc2 = locateProyecto(state, proyectoId);
          if (!loc2) return state;
          const { ownerEmail: ow2 } = loc2;
          return {
            proyectos: {
              ...state.proyectos,
              [ow2]: {
                ...state.proyectos[ow2],
                [proyectoId]: updatedProyecto,
              },
            },
          };
        });
      } catch (err) {
        console.warn("moveTarea falló, se mantiene estado local:", err);
      }
    })();
  },
});
