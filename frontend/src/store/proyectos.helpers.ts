// src/store/proyectos.helpers.ts
import type { TareasStore } from "./tareas.types";
import type { Proyecto } from "../types";

export function locateProyecto(
  state: TareasStore,
  id: string,
): { ownerEmail: string; proyecto: Proyecto } | null {
  for (const ownerEmail of Object.keys(state.proyectos)) {
    const p = state.proyectos[ownerEmail]?.[id];
    if (p) return { ownerEmail, proyecto: p };
  }
  return null;
}

export function canEditProyecto(email: string, p: Proyecto): boolean {
  const e = (email ?? "").trim().toLowerCase();
  const creador = (p.creadoPor ?? "").trim().toLowerCase();
  const usuarios = (p.usuarios ?? []).map((u) => u.toLowerCase());
  return e === creador || usuarios.includes(e);
}
