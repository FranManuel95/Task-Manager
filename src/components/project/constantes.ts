// components/project/constantes.ts
import { Prioridad } from "../../types/tarea";

export type EstadoID = "por-hacer" | "en-progreso" | "completado";

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
