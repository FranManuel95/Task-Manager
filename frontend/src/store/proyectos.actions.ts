// src/store/proyectos.actions.ts
import { TareasStore } from "./tareas.types";
import { Proyecto } from "../types";
import { locateProyecto, canEditProyecto } from "./proyectos.helpers";
import { api } from "../services/api";

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

  // Crea un proyecto nuevo (optimista + persistencia en backend)
  agregarProyecto: (
    email: string,
    nombre: string,
    descripcion?: string,
    color?: string,
    deadline?: string | null
  ): void => {
    const emailLower = (email ?? "").trim().toLowerCase();

    const tempId = `temp-${Date.now()}`;
    const nuevoProyecto: Proyecto = {
      id: tempId,
      nombre,
      descripcion: descripcion ?? "",
      color: color ?? "#3B82F6",
      deadline: deadline ?? null,
      creadoPor: emailLower,
      usuarios: [emailLower],
      tareas: {
        "por-hacer": [],
        "en-progreso": [],
        "completado": [],
      },
    };

    const proyectosActuales = get().proyectos[email] || {};
    const nuevosProyectosUsuario = { ...proyectosActuales, [nuevoProyecto.id]: nuevoProyecto };

    // Optimista
    set({
      proyectos: {
        ...get().proyectos,
        [email]: nuevosProyectosUsuario,
      },
    });

    // Llamada real (no devolvemos Promise para no romper la firma)
    void (async () => {
      try {
        const created = await api.createProyecto({
          nombre: nuevoProyecto.nombre,
          descripcion: nuevoProyecto.descripcion,
          color: nuevoProyecto.color,
          deadline: nuevoProyecto.deadline ?? undefined,
          usuarios: nuevoProyecto.usuarios,
        });

        // Reemplazar tempId por el id real
        const ownerKey = created.creadoPor || email;
        set((state: TareasStore) => {
          const byOwner = state.proyectos[ownerKey] || {};
          const entries = Object.entries(byOwner);
          const mapped = Object.fromEntries(
            entries.map(([id, p]) => (id === tempId ? [created.id, { ...created, tareas: p.tareas }] : [id, p]))
          );

          // Si el ownerKey no existía, nos aseguramos de colocar el proyecto
          if (!byOwner[tempId]) {
            mapped[created.id] = created;
          }

          return {
            proyectos: {
              ...state.proyectos,
              [ownerKey]: mapped,
            },
          };
        });
      } catch (err) {
        console.warn("createProyecto (backend) falló, manteniendo local:", err);
      }
    })();
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
            alert("El proyecto tiene tareas con fecha posterior a la nueva fecha límite.");
            return;
          }
        }
      }
    }

    // Optimista
    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        [ownerEmail]: {
          ...state.proyectos[ownerEmail],
          [id]: { ...proyecto, nombre, descripcion, color, deadline },
        },
      },
    }));

    // Backend
    void (async () => {
      try {
        await api.updateProyecto(id, { nombre, descripcion, color, deadline: deadline ?? null });
      } catch (err) {
        console.warn("updateProyecto (backend) falló, se mantiene estado local:", err);
      }
    })();
  },

  // Elimina un proyecto si el usuario actual es colaborador (o owner)
  eliminarProyecto: (id: string): void => {
    const email = get().usuarioActual;
    const loc = locateProyecto(get(), id);
    if (!loc) return;

    const { ownerEmail } = loc;
    // Optimista
    set((state: TareasStore) => {
      const nuevos = { ...state.proyectos[ownerEmail] };
      delete nuevos[id];
      return { proyectos: { ...state.proyectos, [ownerEmail]: nuevos } };
    });

    // Backend
    void (async () => {
      try {
        await api.deleteProyecto(id);
      } catch (err) {
        console.warn("deleteProyecto (backend) falló:", err);
      }
    })();
  },
});
