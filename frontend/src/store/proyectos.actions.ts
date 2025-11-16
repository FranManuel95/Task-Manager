// src/store/proyectos.actions.ts
import { TareasStore } from "./tareas.types";
import { Proyecto } from "../types";
import { locateProyecto, canEditProyecto } from "./proyectos.helpers";
import { api } from "../services/api";

export const createProyectoActions = (set: any, get: () => TareasStore) => ({
  // Proyectos visibles para el usuario (owner o colaborador)
  getProyectosPorUsuario: (email: string): Record<string, Proyecto> => {
    const todos = get().proyectos;
    const resultado: Record<string, Proyecto> = {};
    const emailLower = (email ?? "").trim().toLowerCase();

    for (const owner of Object.keys(todos)) {
      for (const [id, proyecto] of Object.entries(todos[owner])) {
        const usuarios = (proyecto.usuarios ?? []).map((u) => u.toLowerCase());
        const creator = (proyecto.creadoPor ?? "").toLowerCase();
        const pertenece =
          usuarios.includes(emailLower) || creator === emailLower;
        if (pertenece) resultado[id] = proyecto;
      }
    }
    return resultado;
  },

  // Un proyecto por id si el usuario pertenece
  getProyectoPorId: (email: string, id: string): Proyecto | null => {
    const todos = get().proyectos;
    const emailLower = (email ?? "").trim().toLowerCase();

    for (const owner of Object.keys(todos)) {
      const proyecto = todos[owner]?.[id];
      if (!proyecto) continue;

      const usuarios = (proyecto.usuarios ?? []).map((u) => u.toLowerCase());
      const creator = (proyecto.creadoPor ?? "").toLowerCase();
      const pertenece = usuarios.includes(emailLower) || creator === emailLower;
      if (pertenece) return proyecto;
    }
    return null;
  },

  /** 🔹 NUEVO: hidratar proyectos desde el backend (mezcla no destructiva) */
  hydrateProyectosFromServer: (
    email: string,
    items: Proyecto[] | Record<string, Proyecto>,
  ) => {
    const emailLower = (email ?? "").trim().toLowerCase();

    const array: Proyecto[] = Array.isArray(items)
      ? items
      : Object.values(items || {});

    const grouped: Record<string, Record<string, Proyecto>> = {};

    for (const p of array) {
      const owner = (p.creadoPor ?? emailLower).trim().toLowerCase();
      const id = p.id;

      const normalized: Proyecto = {
        ...p,
        creadoPor: owner,
        usuarios: Array.from(new Set([...(p.usuarios ?? []), owner])).map((u) =>
          String(u).toLowerCase(),
        ),
        color: p.color || "#3B82F6",
        deadline: p.deadline ?? null,
        tareas: p.tareas ?? {
          "por-hacer": [],
          "en-progreso": [],
          completado: [],
        },
      };

      if (!grouped[owner]) grouped[owner] = {};
      grouped[owner][id] = normalized;
    }

    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        ...grouped,
      },
    }));
  },

  /** 🔹 NUEVO: pedir al backend y llamar a hydrate */
  fetchProyectosAndHydrate: async () => {
    const emailLower = (get().usuarioActual ?? "").trim().toLowerCase();
    if (!emailLower) return;

    try {
      const page = await api.listProyectos(); // { items, total, ... }
      const items = Array.isArray((page as any)?.items)
        ? (page as any).items
        : [];

      // ⚠️ Cast para evitar el error de tipo hasta que actualices TareasStore
      const hydrate = (get() as any).hydrateProyectosFromServer as
        | ((
            email: string,
            items: Proyecto[] | Record<string, Proyecto>,
          ) => void)
        | undefined;

      hydrate?.(emailLower, items);
    } catch (e) {
      console.warn("fetchProyectosAndHydrate falló:", e);
    }
  },

  // ⬇️ añade cerca de las otras acciones nuevas
  hydrateProyectoFromServer: (proj: any) => {
    const owner = String(proj.creadoPor ?? "")
      .trim()
      .toLowerCase();
    if (!owner) return;

    const normalized = {
      ...proj,
      creadoPor: owner,
      usuarios: Array.from(new Set([...(proj.usuarios ?? []), owner])).map(
        (u: string) => String(u).toLowerCase(),
      ),
      color: proj.color || "#3B82F6",
      deadline: proj.deadline ?? null,
      tareas: proj.tareas ?? {
        "por-hacer": [],
        "en-progreso": [],
        completado: [],
      },
    };

    // mezcla no destructiva en el bucket por owner
    return (set as any)((state: any) => ({
      proyectos: {
        ...state.proyectos,
        [owner]: {
          ...(state.proyectos?.[owner] || {}),
          [normalized.id]: normalized,
        },
      },
    }));
  },

  fetchProyectoAndHydrate: async (proyectoId: string) => {
    try {
      const proj = await api.getProyecto(proyectoId);
      const hydrate = (get() as any).hydrateProyectoFromServer as (
        p: any,
      ) => void;
      hydrate?.(proj);
    } catch (e) {
      console.warn("fetchProyectoAndHydrate falló:", e);
    }
  },

  // Crear (optimista + normalización de respuesta)
  agregarProyecto: (
    email: string,
    nombre: string,
    descripcion?: string,
    color?: string,
    deadline?: string | null,
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
        completado: [],
      },
    };

    const proyectosActuales = get().proyectos[emailLower] || {};
    const nuevosProyectosUsuario = {
      ...proyectosActuales,
      [tempId]: nuevoProyecto,
    };

    // Optimista
    set({
      proyectos: {
        ...get().proyectos,
        [emailLower]: nuevosProyectosUsuario,
      },
    });

    // Persistencia real
    void (async () => {
      try {
        const created = await api.createProyecto({
          nombre: nuevoProyecto.nombre,
          descripcion: nuevoProyecto.descripcion,
          color: nuevoProyecto.color,
          deadline: nuevoProyecto.deadline ?? undefined,
          usuarios: nuevoProyecto.usuarios,
        });

        set((state: TareasStore) => {
          const next = { ...state.proyectos };

          // tareas que pudiste crear en local sobre el temp
          const tareasFromTemp = next[emailLower]?.[tempId]?.tareas ?? {
            "por-hacer": [],
            "en-progreso": [],
            completado: [],
          };

          // normalizar respuesta del backend
          const normalized: Proyecto = {
            ...created,
            creadoPor: (created.creadoPor ?? emailLower).trim().toLowerCase(),
            usuarios: Array.from(
              new Set(
                [...(created.usuarios ?? []), emailLower].map((u) =>
                  u.toLowerCase(),
                ),
              ),
            ),
            tareas: tareasFromTemp,
          };

          const ownerKey = normalized.creadoPor;

          // limpiar el temp donde esté
          if (next[emailLower]?.[tempId]) {
            const { [tempId]: _drop1, ...rest } = next[emailLower];
            next[emailLower] = rest;
          }
          if (next[ownerKey]?.[tempId]) {
            const { [tempId]: _drop2, ...rest } = next[ownerKey];
            next[ownerKey] = rest;
          }

          // insertar el nuevo real
          const byOwner = next[ownerKey] || {};
          next[ownerKey] = {
            ...byOwner,
            [normalized.id]: normalized,
          };

          return {
            proyectos: next,
            idRemap: { ...(state as any).idRemap, [tempId]: normalized.id },
          } as Partial<TareasStore>;
        });
      } catch (err) {
        console.warn("createProyecto (backend) falló, manteniendo local:", err);
      }
    })();
  },

  // Editar
  editarProyecto: (
    id: string,
    nombre: string,
    descripcion: string,
    color: string,
    deadline: string | null,
  ): void => {
    const emailLower = (get().usuarioActual ?? "").trim().toLowerCase();
    const loc = locateProyecto(get(), id);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;
    if (!canEditProyecto(emailLower, proyecto)) return;

    if (deadline) {
      for (const col of Object.values(proyecto.tareas)) {
        for (const t of col) {
          if (t.deadline && new Date(t.deadline) > new Date(deadline)) {
            alert(
              "El proyecto tiene tareas con fecha posterior a la nueva fecha límite.",
            );
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
        await api.updateProyecto(id, {
          nombre,
          descripcion,
          color,
          deadline: deadline ?? null,
        });
      } catch (err) {
        console.warn(
          "updateProyecto (backend) falló, se mantiene estado local:",
          err,
        );
      }
    })();
  },

  // Eliminar
  eliminarProyecto: (id: string): void => {
    const emailLower = (get().usuarioActual ?? "").trim().toLowerCase();
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
