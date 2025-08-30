// types/tarea.ts

export type Prioridad = "alta" | "media" | "baja";

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  deadline?: string | null;
  etiquetas: string[];
}
