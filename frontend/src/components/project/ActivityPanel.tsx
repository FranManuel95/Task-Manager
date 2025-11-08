import { useEffect, useMemo, useState, ReactNode } from "react";
import { audit, type AuditItem } from "../../services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { safeParseDate } from "../../lib/date";

// Mapea claves -> etiquetas legibles (tarea + proyecto)
const FIELD_LABELS: Record<string, string> = {
  // Tarea
  titulo: "título",
  descripcion: "descripción",
  prioridad: "prioridad",
  deadline: "fecha límite",
  estado: "estado",
  etiquetas: "etiquetas",

  // Proyecto
  nombre: "nombre",
  color: "color",
  usuarios: "usuarios",
  creadoPor: "creado por",
  creadoPorName: "creado por (nombre)",
};

// Estados más comunes (ajusta si usas otros)
const ESTADO_LABEL: Record<string, string> = {
  "por-hacer": "Por hacer",
  "en-progreso": "En progreso",
  "bloqueado": "Bloqueado",
  "completado": "Completado",
};

// Prioridad legible
const PRIORIDAD_LABEL: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

// --- helpers de formateo ---
function isDateLikeString(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s);
}

/** Render genérico de valores (puede devolver nodos ricos) */
function fmtValue(val: any, field?: string): ReactNode {
  if (field === "deadline" && typeof val === "string" && isDateLikeString(val)) {
    const d = safeParseDate(val);
    return d ? format(d, "dd MMM yyyy", { locale: es }) : val;
  }

  if (field === "estado" && typeof val === "string") {
    return ESTADO_LABEL[val] ?? val;
  }

  if (field === "prioridad" && typeof val === "string") {
    return PRIORIDAD_LABEL[val] ?? val;
  }

  if (field === "color" && typeof val === "string" && /^#?[0-9a-f]{6}$/i.test(val)) {
    const hex = val.startsWith("#") ? val : `#${val}`;
    return (
      <span className="inline-flex items-center gap-2">
        <span
          aria-label={`Color ${hex}`}
          title={hex}
          className="inline-block w-4 h-4 rounded-full border border-[rgb(var(--color-border))]"
          style={{ backgroundColor: hex }}
        />
        <code>{hex}</code>
      </span>
    );
  }

  if (field === "etiquetas" && Array.isArray(val)) {
    return (
      <span className="inline-flex flex-wrap gap-1 align-middle">
        {val.map((t: string, i: number) => (
          <span
            key={i}
            className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
          >
            #{t}
          </span>
        ))}
      </span>
    );
  }

  if (val == null) return "—";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "string") return val;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function fmtDiffBefore(val: any, field?: string) {
  return fmtValue(val, field);
}
function fmtDiffAfter(val: any, field?: string) {
  return fmtValue(val, field);
}

/** Intenta obtener el nombre legible de la entidad (tarea/proyecto), incluso si cambió */
function deriveEntityName(item: AuditItem): string {
  const payload = ((item as any).payload ?? {}) as any;
  const diff = payload?.diff;
  const before = payload?.before;
  const after = payload?.after;

  // Preferimos nombre/titulo del AFTER (estado actual), luego BEFORE, luego diff
  const fromAfter = after?.nombre || after?.titulo;
  if (fromAfter) return String(fromAfter);

  const fromBefore = before?.nombre || before?.titulo;
  if (fromBefore) return String(fromBefore);

  const fromDiff =
    diff?.nombre?.after || diff?.titulo?.after || diff?.entityName?.after;
  if (fromDiff) return String(fromDiff);

  // fallback a lo que ya venías usando
  return (
    item.displayName ||
    (payload && (payload as any).entityName) ||
    item.entityId ||
    "—"
  );
}

function makeTitle(item: AuditItem) {
  const name = deriveEntityName(item);
  switch (item.action) {
    case "create":
      return `Creación de ${item.entity} · ${name}`;
    case "delete":
      return `Eliminación de ${item.entity} · ${name}`;
    case "move":
      return `Movimiento de ${item.entity} · ${name}`;
    case "update":
      return `Modificación de ${item.entity} · ${name}`;
    default:
      return `${item.entity} • ${item.action} · ${name}`;
  }
}

/** Orden opcional de campos para que proyectos/tareas salgan con prioridad lógica */
const FIELD_ORDER = [
  "nombre",
  "titulo",
  "descripcion",
  "estado",
  "prioridad",
  "deadline",
  "etiquetas",
  "color",
  "usuarios",
  "creadoPorName",
  "creadoPor",
];

function DiffView({ item, compact }: { item: AuditItem; compact: boolean }) {
  const tsStr =
    (item as any).ts ?? (item as any).createdAt ?? (item as any).created_at ?? null;
  const d = safeParseDate(tsStr);
  const when = d ? format(d, "dd MMM yyyy", { locale: es }) : "—";

  const actor = item.actorName || item.actorEmail || "—";
  const payload = ((item as any).payload ?? {}) as any;

  const isPlainObject = (o: any) => o && typeof o === "object" && !Array.isArray(o);

  const diff: Record<string, { before: any; after: any }> | undefined =
    isPlainObject(payload.diff) ? (payload.diff as any) : undefined;

  const before = isPlainObject(payload.before) ? payload.before : undefined;
  const after = isPlainObject(payload.after) ? payload.after : undefined;

  let rows: Array<{
    label: string;
    fieldKey: string;
    before?: any;
    after?: any;
    type: "update" | "create" | "delete";
  }> = [];

  if ((item.action === "update" || item.action === "move") && diff && Object.keys(diff).length > 0) {
    rows = Object.entries(diff).map(([k, v]) => ({
      fieldKey: k,
      label: FIELD_LABELS[k] || k,
      before: (v as any).before,
      after: (v as any).after,
      type: "update" as const,
    }));
  } else if (item.action === "create" && after) {
    rows = Object.entries(after).map(([k, v]) => ({
      fieldKey: k,
      label: FIELD_LABELS[k] || k,
      after: v,
      type: "create" as const,
    })) as any;
  } else if (item.action === "delete" && before) {
    rows = Object.entries(before).map(([k, v]) => ({
      fieldKey: k,
      label: FIELD_LABELS[k] || k,
      before: v,
      type: "delete" as const,
    })) as any;
  }

  // Ordena las filas con FIELD_ORDER como guía
  rows.sort((a, b) => {
    const ia = FIELD_ORDER.indexOf(a.fieldKey);
    const ib = FIELD_ORDER.indexOf(b.fieldKey);
    const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
    const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
    return sa - sb || a.fieldKey.localeCompare(b.fieldKey);
  });

  return (
    <div className="p-3 flex items-start gap-3 hover:bg-[rgb(var(--color-card))]/60 transition-colors duration-300">
      <div className="text-gray-400 dark:text-gray-500">📝</div>
      <div className="flex-1">
        <div className="text-sm font-medium dark:text-white">{makeTitle(item)}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">por {actor}</div>

        {!compact && rows.length > 0 && (
          <div className="dark:text-gray-400 mt-1 text-xs space-y-0.5">
            {rows.map((r, idx) => {
              if (r.type === "update") {
                return (
                  <div className="dark:text-gray-400" key={idx}>
                    <span className="font-medium">Modificación de {r.label}:</span>{" "}
                    <span className="line-through opacity-60 break-all">
                      {fmtDiffBefore(r.before, r.fieldKey)}
                    </span>{" "}
                    <span>→</span>{" "}
                    <span className="break-all">
                      {fmtDiffAfter(r.after, r.fieldKey)}
                    </span>
                  </div>
                );
              } else if (r.type === "create") {
                return (
                  <div key={idx}>
                    <span className="font-medium">Valor inicial de {r.label}:</span>{" "}
                    <span className="break-all">
                      {fmtDiffAfter(r.after, r.fieldKey)}
                    </span>
                  </div>
                );
              } else {
                return (
                  <div key={idx}>
                    <span className="font-medium">Último valor de {r.label}:</span>{" "}
                    <span className="break-all">
                      {fmtDiffBefore(r.before, r.fieldKey)}
                    </span>
                  </div>
                );
              }
            })}
          </div>
        )}

        <div className="text-[11px] text-gray-400 mt-1">{when}</div>
      </div>
    </div>
  );
}

type Props = {
  proyectoId: string;
  initialLimit?: number;   // default 5
  enableFilter?: boolean;  // default true
  compact?: boolean;       // muestra sin diffs detallados
  className?: string;
};

export default function ActivityPanel({
  proyectoId,
  initialLimit = 5,
  enableFilter = true,
  compact = false,
  className = "",
}: Props) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [action, setAction] = useState<"" | "create" | "update" | "move" | "delete">("");

  const load = async (cur: string | null) => {
    setLoading(true);
    try {
      const res = await audit.list(proyectoId, { cursor: cur ?? undefined, limit: 50 });
      const normalized = res.items.map((it: any) => ({
        ...it,
        ts: it.ts ?? it.createdAt ?? it.created_at ?? null,
      })) as AuditItem[];
      setItems((prev) => (cur ? [...prev, ...normalized] : normalized));
      setNextCursor(res.nextCursor ?? null);
      setCursor(cur ?? null);
    } catch (e) {
      console.warn("audit load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setNextCursor(null);
    void load(null);
  }, [proyectoId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (action && it.action !== action) return false;
      if (!term) return true;

      const actor = (it.actorName || it.actorEmail || "").toLowerCase();
      const entity = (it.entity || "").toLowerCase();

      const payload = ((it as any).payload ?? {}) as any;
      const diff = payload?.diff ?? {};
      const before = payload?.before ?? {};
      const after = payload?.after ?? {};

      const display =
        (it.displayName || "").toLowerCase() ||
        String(deriveEntityName(it)).toLowerCase();

      const nameHints = [
        before?.nombre, after?.nombre, diff?.nombre?.before, diff?.nombre?.after,
        before?.titulo, after?.titulo, diff?.titulo?.before, diff?.titulo?.after,
      ]
        .filter(Boolean)
        .map((x: string) => String(x).toLowerCase())
        .join(" ");

      const hay = `${actor} ${entity} ${display} ${nameHints}`.includes(term);
      return hay;
    });
  }, [items, q, action]);

  const [visible, setVisible] = useState(initialLimit);
  useEffect(() => setVisible(initialLimit), [initialLimit, proyectoId, q, action]);

  const shown = filtered.slice(0, visible);

  return (
    <div className={className}>
      {enableFilter && (
        <div className="dark:text-white flex items-center gap-2 p-3 border-b border-[rgb(var(--color-border))]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (actor, entidad, nombre)…"
            className="dark:text-white flex-1 rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as any)}
            className="hover:cursor-pointer hover:border-gray-500 w-36 rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
          >
            <option value="">Todas</option>
            <option value="create">Creación</option>
            <option value="update">Modificación</option>
            <option value="move">Movimiento</option>
            <option value="delete">Eliminación</option>
          </select>
        </div>
      )}

      <div className="divide-y divide-[rgb(var(--color-border))]">
        {shown.length === 0 && !loading && (
          <div className="p-4 text-sm text-gray-500 text-center">
            Sin resultados.
          </div>
        )}

        {shown.map((it) => (
          <DiffView key={it.id} item={it} compact={compact} />
        ))}

        {loading && (
          <div className="p-3 text-sm text-gray-500 text-center">Cargando…</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--color-border))] p-3">
        <button
          onClick={() => setVisible((v) => Math.max(initialLimit, v - initialLimit))}
          className="hover:border-gray-500 dark:text-white rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition disabled:opacity-50 hover:cursor-pointer"
          disabled={visible <= initialLimit}
        >
          Ver menos
        </button>

        <div className="text-[11px] text-gray-500">
          Mostrando {Math.min(visible, filtered.length)} de {filtered.length}
        </div>

        <div className="flex gap-2">
          {visible < filtered.length && (
            <button
              onClick={() => setVisible((v) => v + initialLimit)}
              className="hover:border-gray-500 rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition hover:cursor-pointer"
            >
              Cargar más
            </button>
          )}
          {nextCursor && (
            <button
              onClick={() => load(nextCursor)}
              className="rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition"
              title="Obtener más del servidor"
            >
              Más del servidor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
