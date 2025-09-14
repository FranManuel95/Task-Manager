// backend/src/mappers.ts
import type { Proyecto as ProyectoDB, Tarea as TareaDB } from "@prisma/client";

// Estados en DB (snake_case)
export type EstadoDB = "por_hacer" | "en_progreso" | "completado";
// Estados que usa el frontend (kebab-case)
export type EstadoOut = "por-hacer" | "en-progreso" | "completado";

export type TareaOut = {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: "baja" | "media" | "alta";
  deadline: string | null; // ISO
  etiquetas: string[];
};

export type ProyectoOut = {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  deadline: string | null; // ISO
  creadoPor: string;       // email
  usuarios: string[];      // emails (scalar array)
  tareas: Record<EstadoOut, TareaOut[]>;
};

export const fromDbEstado = (e: EstadoDB): EstadoOut =>
  e === "por_hacer" ? "por-hacer" : e === "en_progreso" ? "en-progreso" : "completado";

export const toDbEstado = (e: EstadoOut): EstadoDB =>
  e === "por-hacer" ? "por_hacer" : e === "en-progreso" ? "en_progreso" : "completado";

export const tareaFromDB = (t: TareaDB): TareaOut => ({
  id: t.id,
  titulo: t.titulo,
  descripcion: t.descripcion ?? "",
  prioridad: t.prioridad as TareaOut["prioridad"],
  deadline: t.deadline ? t.deadline.toISOString() : null,
  etiquetas: t.etiquetas ?? [],
});

export function proyectoFromDB(
  p: ProyectoDB & { tareas?: TareaDB[] }
): ProyectoOut {
  const grouped: Record<EstadoOut, TareaOut[]> = {
    "por-hacer": [],
    "en-progreso": [],
    "completado": [],
  };

  for (const t of p.tareas ?? []) {
    const estadoOut = fromDbEstado(t.estado as EstadoDB);
    grouped[estadoOut].push(tareaFromDB(t));
  }

  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? "",
    color: p.color,
    deadline: p.deadline ? p.deadline.toISOString() : null,
    creadoPor: p.creadoPor,
    usuarios: [...(p.usuarios ?? [])],
    tareas: grouped,
  };
}
