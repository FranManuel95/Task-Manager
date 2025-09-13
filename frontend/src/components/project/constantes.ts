import { Estado, Prioridad } from "../../types";

export const estados: Array<{ id: Estado; titulo: string }> = [
  { id: "por-hacer",   titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado",  titulo: "Completado" },
];

export const columnaColors: Record<Estado, string> = {
  "por-hacer":   "bg-yellow-100",
  "en-progreso": "bg-blue-100",
  "completado":  "bg-green-100",
};

export const ordenPrioridad: Record<Prioridad, number> = {
  alta: 1,
  media: 2,
  baja: 3,
};
