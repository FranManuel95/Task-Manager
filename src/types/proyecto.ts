// src/types/proyecto.ts
import { Tarea } from "./tarea";
import { Estado } from "./estado";

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  deadline?: string | null;
  creadoPor: string;
  usuarios: string[];
  tareas: Record<Estado, Tarea[]>;
}
