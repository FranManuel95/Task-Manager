import { TareasStore } from "./tareas.types";
import { Proyecto } from "../types";

export function locateProyecto(state: TareasStore, proyectoId: string):
  | { ownerEmail: string; proyecto: Proyecto }
  | null {
  for (const [email, byId] of Object.entries(state.proyectos)) {
    const proyecto = byId?.[proyectoId];
    if (proyecto) return { ownerEmail: email, proyecto };
  }
  return null;
}

export function canEditProyecto(email: string | null, proyecto?: Proyecto | null) {
  return !!(email && proyecto && proyecto.usuarios.includes(email));
}
