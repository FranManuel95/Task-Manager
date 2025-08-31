// src/store/proyectos.actions.ts
import { TareasStore } from "./tareas.types";
import { Proyecto } from "@/types";
import { locateProyecto, canEditProyecto } from "./proyectos.helpers";

export const createProyectoActions = (set: any, get: () => TareasStore) => ({
  // Devuelve los proyectos en los que el usuario participa (owner o colaborador)
  getProyectosPorUsuario: (email: string): Record<string, Proyecto> => {
    const todos = get().proyectos;
    const resultado: Record<string, Proyecto> = {};
    const emailLower = (email ?? "").trim().toLowerCase();

    for (const owner of Object.keys(todos)) {
      for (const [id, proyecto] of Object.entries(todos[owner])) {
        const pertenece = (proyecto.usuarios ?? []).some(
          (u) => u.toLowerCase() === emailLower
        );
        if (pertenece) resultado[id] = proyecto;
      }
    }
    return resultado;
  },

  // Obtiene un proyecto por id SOLO si el email tiene acceso (colaborador/owner)
  getProyectoPorId: (email: string, id: string): Proyecto | null => {
    const todos = get().proyectos;
    const emailLower = (email ?? "").trim().toLowerCase();

    for (const owner of Object.keys(todos)) {
      const proyecto = todos[owner]?.[id];
      if (!proyecto) continue;

      const pertenece = (proyecto.usuarios ?? []).some(
        (u) => u.toLowerCase() === emailLower
      );
      if (pertenece) return proyecto;
    }
    return null;
  },

  // Crea un proyecto nuevo bajo el "bucket" del email pasado
  agregarProyecto: (
    email: string,
    nombre: string,
    descripcion?: string,
    color?: string,
    deadline?: string | null
  ): void => {
    const emailLower = (email ?? "").trim().toLowerCase();

    const nuevoProyecto: Proyecto = {
      id: Date.now().toString(),
      nombre,
      descripcion: descripcion ?? "",
      color: color ?? "#3B82F6",
      deadline: deadline ?? null,
      creadoPor: emailLower,
      usuarios: [emailLower], // el owner entra como primer colaborador
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
        [email]: nuevosProyectosUsuario, // mantenemos la clave tal cual vino `email`
      },
    });
  },

  // Edita un proyecto si el usuario actual es colaborador (o owner)
  editarProyecto: (
    id: string,
    nombre: string,
    descripcion: string,
    color: string,
    deadline: string | null
  ): void => {
    const email = get().usuarioActual;
    const loc = locateProyecto(get(), id);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    // Validación de deadlines: no permitir tareas con fecha posterior a la nueva fecha límite
    if (deadline) {
      for (const col of Object.values(proyecto.tareas)) {
        for (const t of col) {
          if (t.deadline && new Date(t.deadline) > new Date(deadline)) {
            alert(
              "El proyecto tiene tareas con fecha posterior a la nueva fecha límite."
            );
            return;
          }
        }
      }
    }

    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        [ownerEmail]: {
          ...state.proyectos[ownerEmail],
          [id]: { ...proyecto, nombre, descripcion, color, deadline },
        },
      },
    }));
  },

  // Elimina un proyecto si el usuario actual es colaborador (o owner)
  eliminarProyecto: (id: string): void => {
    const email = get().usuarioActual;
    const loc = locateProyecto(get(), id);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(email, proyecto)) return;

    set((state: TareasStore) => {
      const nuevos = { ...state.proyectos[ownerEmail] };
      delete nuevos[id];
      return { proyectos: { ...state.proyectos, [ownerEmail]: nuevos } };
    });
  },
});
