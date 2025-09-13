// src/store/colaboradores.actions.ts
import { TareasStore } from "./tareas.types";
import { locateProyecto, canEditProyecto } from "./proyectos.helpers";
import { api } from "../services/api";

export const createColaboradorActions = (set: any, get: () => TareasStore) => ({
  agregarColaborador: (proyectoId: string, nuevoEmail: string): void => {
    const emailActual = get().usuarioActual;
    if (!emailActual) return;

    const loc = locateProyecto(get(), proyectoId);
    if (!loc) return;

    const { ownerEmail, proyecto } = loc;

    // Solo quien figure como colaborador puede invitar
    if (!canEditProyecto(emailActual, proyecto)) return;

    const emailLimpio = (nuevoEmail ?? "").trim().toLowerCase();
    if (!emailLimpio) return;

    // Evita duplicados
    if (proyecto.usuarios.includes(emailLimpio)) return;

    // Optimista
    set((state: TareasStore) => ({
      proyectos: {
        ...state.proyectos,
        [ownerEmail]: {
          ...state.proyectos[ownerEmail],
          [proyectoId]: {
            ...proyecto,
            usuarios: [...proyecto.usuarios, emailLimpio],
          },
        },
      },
    }));

    // Backend
    void (async () => {
      try {
        await api.addUsuarioAProyecto(proyectoId, emailLimpio);
      } catch (err) {
        console.warn("addUsuarioAProyecto falló, se mantiene estado local:", err);
      }
    })();
  },
});
