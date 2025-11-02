import { Estado, Prioridad } from "../../types";

export const estados: Array<{ id: Estado; titulo: string }> = [
  { id: "por-hacer",   titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado",  titulo: "Completado" },
];

// Colores sutiles por columna (light + dark)
export const columnaColors: Record<string, string> = {
  // header de columna (no el body) — tonos muy suaves
  todo:     "bg-amber-50/70 dark:bg-amber-950/20",
  doing:    "bg-sky-50/70 dark:bg-sky-950/20",
  done:     "bg-emerald-50/70 dark:bg-emerald-950/20",

  // Si tienes más estados, añade aquí con el mismo patrón
};


export const ordenPrioridad: Record<Prioridad, number> = {
  alta: 1,
  media: 2,
  baja: 3,
};
