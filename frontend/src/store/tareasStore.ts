import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TareasStore } from "./tareas.types";
import { createProyectoActions } from "./proyectos.actions";
import { locateProyecto, canEditProyecto } from "./proyectos.helpers";
import { api } from "../services/api";
import type { Estado, Prioridad, Tarea } from "../types";

/* -------------------- Helpers de mapeo -------------------- */
function tareaFromApi(t: any): Tarea {
  return {
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion ?? "",
    prioridad: t.prioridad,
    deadline: t.deadline ?? null,
    etiquetas: t.etiquetas ?? [],
    createdBy: t.createdBy ?? null,
    createdByName: t.createdByName ?? null,
    updatedBy: t.updatedBy ?? null,
    updatedByName: t.updatedByName ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

function replaceTaskInColumn(
  list: Tarea[],
  tareaId: string,
  replacer: (prev: Tarea) => Tarea
): Tarea[] {
  return list.map((t) => (t.id === tareaId ? replacer(t) : t));
}

export const useTareasStore = create<TareasStore>()(
  persist(
    (set, get) => ({
      usuarioActual: "",
      setUsuarioActual: (email: string) =>
        set({ usuarioActual: (email ?? "").trim().toLowerCase() }),

      proyectos: {},      // ownerLower -> id -> Proyecto
      idRemap: {},        // tempId -> realId

      // filtros
      searchTerm: "",
      filterPrioridad: "todas",
      setSearchTerm: (v: string) => set({ searchTerm: v }),
      setFilterPrioridad: (v) => set({ filterPrioridad: v }),

      // --- Acciones de proyectos (crear/editar/eliminar, etc) ---
      ...createProyectoActions(set, get),

      // --- Colaboradores ---
      agregarColaborador: (proyectoId: string, emailAgregar: string) => {
        const nuevoLower = (emailAgregar ?? "").trim().toLowerCase();
        if (!nuevoLower) return;

        const current = (get().usuarioActual ?? "").trim().toLowerCase();
        const loc = locateProyecto(get(), proyectoId);
        if (!loc) return;

        const { ownerEmail, proyecto } = loc;
        if (!canEditProyecto(current, proyecto)) return;

        const yaEsta = (proyecto.usuarios ?? []).some(
          (u) => (u ?? "").trim().toLowerCase() === nuevoLower
        );
        if (yaEsta) return;

        // Optimista
        set((state) => ({
          proyectos: {
            ...state.proyectos,
            [ownerEmail]: {
              ...state.proyectos[ownerEmail],
              [proyectoId]: {
                ...proyecto,
                usuarios: [...(proyecto.usuarios ?? []), nuevoLower],
              },
            },
          },
        }));

        // Backend si no es temporal
        if (!proyectoId.startsWith("temp-")) {
          void api
            .addUsuarioAProyecto(proyectoId, nuevoLower)
            .catch((e) => console.warn("addUsuarioAProyecto falló:", e));
        }
      },

      // --- Tareas ---
      agregarTarea: (proyectoId: string, estado: Estado, titulo: string) => {
        const email = (get().usuarioActual ?? "").trim().toLowerCase();
        const loc = locateProyecto(get(), proyectoId);
        if (!loc) return;
        const { ownerEmail, proyecto } = loc;
        if (!canEditProyecto(email, proyecto)) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Tarea temporal (optimista) con metadatos básicos
        const nueva: Tarea = {
          id: tempId,
          titulo: titulo.trim(),
          descripcion: "",
          prioridad: "media" as Prioridad,
          deadline: null,
          etiquetas: [],
          createdBy: email,
          createdByName: null,
          updatedBy: email,
          updatedByName: null,
          updatedAt: new Date().toISOString(),
        };

        // Optimista
        set((state) => ({
          proyectos: {
            ...state.proyectos,
            [ownerEmail]: {
              ...state.proyectos[ownerEmail],
              [proyectoId]: {
                ...proyecto,
                tareas: {
                  ...proyecto.tareas,
                  [estado]: [...proyecto.tareas[estado], nueva],
                },
              },
            },
          },
        }));

        // Persistencia real + remapeo id y sustitución por el objeto completo del backend
        if (!proyectoId.startsWith("temp-")) {
          (async () => {
            try {
              const created = await api.createTarea(proyectoId, estado, {
                titulo: nueva.titulo,
                descripcion: "",
                prioridad: "media",
                deadline: null,
                etiquetas: [],
              });

              const createdMapped = tareaFromApi(created);

              set((state) => {
                const p = state.proyectos[ownerEmail]?.[proyectoId];
                if (!p) return state;
                const col = p.tareas[estado].map((t) =>
                  t.id === tempId ? createdMapped : t
                );
                return {
                  proyectos: {
                    ...state.proyectos,
                    [ownerEmail]: {
                      ...state.proyectos[ownerEmail],
                      [proyectoId]: {
                        ...p,
                        tareas: { ...p.tareas, [estado]: col },
                      },
                    },
                  },
                };
              });
            } catch (e) {
              console.warn("createTarea falló; te quedas con la tarea local:", e);
            }
          })();
        }
      },

      eliminarTarea: (proyectoId: string, estado: Estado, tareaId: string) => {
        const email = get().usuarioActual;
        const loc = locateProyecto(get(), proyectoId);
        if (!loc) return;
        const { ownerEmail, proyecto } = loc;
        if (!canEditProyecto(email, proyecto)) return;

        // Optimista
        set((state) => ({
          proyectos: {
            ...state.proyectos,
            [ownerEmail]: {
              ...state.proyectos[ownerEmail],
              [proyectoId]: {
                ...proyecto,
                tareas: {
                  ...proyecto.tareas,
                  [estado]: proyecto.tareas[estado].filter((t) => t.id !== tareaId),
                },
              },
            },
          },
        }));

        // Si la tarea aún es temporal, no intentes borrar en backend
        if (!proyectoId.startsWith("temp-") && !tareaId.startsWith("temp-")) {
          void api
            .deleteTarea(proyectoId, tareaId)
            .catch((e) => console.warn("deleteTarea falló:", e));
        }
      },

      moverTarea: (proyectoId: string, tareaId: string, destino: Estado) => {
        const st = get();
        const loc = locateProyecto(st, proyectoId);
        if (!loc) return;

        const { ownerEmail, proyecto } = loc;
        const actor = (st.usuarioActual ?? "").trim().toLowerCase();

        // 1) localizar columna origen
        const columnas: Estado[] = ["por-hacer", "en-progreso", "completado"];
        let from: Estado | null = null;
        for (const col of columnas) {
          if (proyecto.tareas[col].some((t) => t.id === tareaId)) {
            from = col;
            break;
          }
        }
        if (!from || from === destino) return;

        // 2) mover en local (optimista) + marcar updatedBy/updatedAt
        set((state) => {
          const p = state.proyectos[ownerEmail]?.[proyectoId];
          if (!p) return state;

          const tarea = p.tareas[from!].find((t) => t.id === tareaId);
          if (!tarea) return state;

          const now = new Date().toISOString();
          const origenList = p.tareas[from!].filter((t) => t.id !== tareaId);
          const moved: Tarea = {
            ...tarea,
            updatedBy: actor || tarea.updatedBy || null,
            updatedByName: tarea.updatedByName ?? null,
            updatedAt: now,
          };
          const destinoList = [...p.tareas[destino], moved];

          return {
            proyectos: {
              ...state.proyectos,
              [ownerEmail]: {
                ...state.proyectos[ownerEmail],
                [proyectoId]: {
                  ...p,
                  tareas: {
                    ...p.tareas,
                    [from!]: origenList,
                    [destino]: destinoList,
                  },
                },
              },
            },
          };
        });

        // 3) persistir en backend si no es temporal
        if (!proyectoId.startsWith("temp-") && !tareaId.startsWith("temp-")) {
          (async () => {
            try {
              // si tu endpoint devuelve la tarea, podrías re-sincronizarla aquí
              await api.moveTarea(proyectoId, { tareaId, from, to: destino });
            } catch (err) {
              console.warn("moveTarea (backend) falló, se mantiene estado local:", err);
              // opcional: revertir aquí si quisieras
            }
          })();
        }
      },

      editarTarea: (
        proyectoId,
        estado,
        tareaId,
        titulo,
        descripcion,
        prioridad,
        deadline,
        etiquetas
      ) => {
        const email = (get().usuarioActual ?? "").trim().toLowerCase();
        const loc = locateProyecto(get(), proyectoId);
        if (!loc) return;
        const { ownerEmail, proyecto } = loc;
        if (!canEditProyecto(email, proyecto)) return;

        const now = new Date().toISOString();

        // Optimista + marcar updatedBy/updatedAt
        set((state) => {
          const p = state.proyectos[ownerEmail]?.[proyectoId];
          if (!p) return state;
          const editadas = p.tareas[estado].map((t) =>
            t.id === tareaId
              ? {
                  ...t,
                  titulo,
                  descripcion,
                  prioridad,
                  deadline,
                  etiquetas,
                  updatedBy: email || t.updatedBy || null,
                  updatedAt: now,
                }
              : t
          );
          return {
            proyectos: {
              ...state.proyectos,
              [ownerEmail]: {
                ...state.proyectos[ownerEmail],
                [proyectoId]: {
                  ...p,
                  tareas: { ...p.tareas, [estado]: editadas },
                },
              },
            },
          };
        });

        // Si la tarea aún es temporal, no pegues al backend
        if (proyectoId.startsWith("temp-") || tareaId.startsWith("temp-")) return;

        void api
          .updateTarea(proyectoId, tareaId, {
            titulo,
            descripcion,
            prioridad,
            deadline,
            etiquetas,
          })
          .then((resp) => {
            if (!resp) return;
            const updated = tareaFromApi(resp);
            set((state) => {
              const p = state.proyectos[ownerEmail]?.[proyectoId];
              if (!p) return state;
              const col = replaceTaskInColumn(p.tareas[estado], tareaId, () => updated);
              return {
                proyectos: {
                  ...state.proyectos,
                  [ownerEmail]: {
                    ...state.proyectos[ownerEmail],
                    [proyectoId]: {
                      ...p,
                      tareas: { ...p.tareas, [estado]: col },
                    },
                  },
                },
              };
            });
          })
          .catch((e) => console.warn("updateTarea falló:", e));
      },
    }),
    { name: "tareas-storage" }
  )
);
