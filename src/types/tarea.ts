    // types/tarea.ts
export type Prioridad = "alta" | "media" | "baja";

export type TareaType = {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad?: Prioridad;
  deadline?: string;
  etiquetas?: string[];
  completado?: boolean;
};
