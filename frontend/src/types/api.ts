// src/types/api.ts
import type { ISODateString } from "./common";
import type { Prioridad, Tarea } from "./tarea";
import type { Estado } from "./estado";
import type { Proyecto } from "./proyecto";

/** ---------------- Proyectos ---------------- */

export interface CreateProyectoDTO {
  nombre: string;
  descripcion: string;
  color: string;
  deadline?: ISODateString | null;
  usuarios?: string[]; // emails o IDs según tu backend
}

export interface UpdateProyectoDTO {
  nombre?: string;
  descripcion?: string;
  color?: string;
  deadline?: ISODateString | null;
  usuarios?: string[];
}

export type ProyectoResponse = Proyecto;

/** ---------------- Tareas ---------------- */

export interface CreateTareaDTO {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  deadline?: ISODateString | null;
  etiquetas?: string[];
  estado?: Estado; // si no se manda, el backend puede poner "por-hacer"
}

export interface UpdateTareaDTO {
  titulo?: string;
  descripcion?: string;
  prioridad?: Prioridad;
  deadline?: ISODateString | null;
  etiquetas?: string[];
}

export interface MoveTareaDTO {
  tareaId: string;
  from: Estado;
  to: Estado;
  /** posición en la columna destino (opcional) */
  index?: number;
}

export type TareaResponse = Tarea;

/** ---------------- Colaboradores ---------------- */

export interface AddUsuarioProyectoDTO {
  proyectoId: string;
  usuario: string; // email o id
}

export interface RemoveUsuarioProyectoDTO {
  proyectoId: string;
  usuario: string; // email o id
}
