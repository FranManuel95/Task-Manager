// types/tarea.ts

export type Prioridad = "alta" | "media" | "baja";

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  deadline?: string | null;
  etiquetas: string[];
  createdBy?: string | null; // email del autor
  createdByName?: string | null; // nombre resuelto (si el backend lo envía)
  updatedBy?: string | null; // email del último editor
  updatedByName?: string | null; // nombre resuelto
  updatedAt?: string | null;
}
