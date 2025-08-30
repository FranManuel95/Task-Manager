// components/project/constantes.ts

export type EstadoID = "por-hacer" | "en-progreso" | "completado";
export type Prioridad = "alta" | "media" | "baja";

export type TareaType = {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad?: Prioridad;
  deadline?: string;
  etiquetas?: string[];
};

export const estados: { id: EstadoID; titulo: string }[] = [
  { id: "por-hacer", titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado", titulo: "Completado" },
];

export const columnaColors: Record<EstadoID, string> = {
  "por-hacer": "bg-yellow-100",
  "en-progreso": "bg-blue-100",
  "completado": "bg-green-100",
};

export const ordenPrioridad: Record<Prioridad, number> = {
  alta: 1,
  media: 2,
  baja: 3,
};
