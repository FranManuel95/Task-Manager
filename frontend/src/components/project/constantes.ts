import { Estado, Prioridad } from "../../types";

export const estados: Array<{ id: Estado; titulo: string }> = [
  { id: "por-hacer",   titulo: "Por hacer" },
  { id: "en-progreso", titulo: "En progreso" },
  { id: "completado",  titulo: "Completado" },
];

/**
 * Colores sutiles por columna (light + dark)
 * Nota: Solo aplicamos fondo del header para no “ensuciar” el body de la tarjeta.
 */
export const columnaColors: Record<Estado, string> = {
  "por-hacer":   "bg-amber-200/70",
  "en-progreso": "bg-sky-200/70 ",
  "completado":  "bg-emerald-200/70 ",
};

/** Iconos por estado (refuerzo visual además del color) */
export const columnaIcons: Record<Estado, string> = {
  "por-hacer":   "⏳",
  "en-progreso": "🔄",
  "completado":  "✅",
};

export const ordenPrioridad: Record<Prioridad, number> = {
  alta: 1,
  media: 2,
  baja: 3,
};
