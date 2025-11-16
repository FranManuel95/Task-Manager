// utils/date.ts

export function fromNow(iso?: string | Date | null) {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return ""; // fecha inválida => no mostramos nada

  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const dyy = Math.floor(h / 24);
  return `hace ${dyy} d`;
}

/** Parse seguro para ISO u objeto Date. Devuelve null si no es válido. */
export function safeParseDate(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date)
    return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}
