import { useEffect, useMemo, useState } from "react";
import { audit, type AuditItem } from "../../services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { safeParseDate } from "../../lib/date";

const FIELD_LABELS: Record<string, string> = {
  titulo: "título",
  descripcion: "descripción",
  prioridad: "prioridad",
  deadline: "fecha límite",
  estado: "estado",
  etiquetas: "etiquetas",
};

// --- helpers de formateo de valores (aplica fecha SOLO como dd MMM yyyy) ---
function isDateLikeString(s: string) {
  // "YYYY-MM-DD" o ISO con tiempo
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)
  );
}

function fmtValue(val: any, field?: string): string {
  // Para deadline, si recibimos string fecha/ISO -> dd MMM yyyy
  if (field === "deadline" && typeof val === "string" && isDateLikeString(val)) {
    const d = safeParseDate(val);
    return d ? format(d, "dd MMM yyyy", { locale: es }) : val;
  }

  if (val == null) return "—";
  if (Array.isArray(val)) return val.join(", ");

  // Si es string genérico y parece fecha, SOLO la mostramos como fecha si el campo lo pide (deadline)
  // Para otros campos, la dejamos tal cual.
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

function makeTitle(item: AuditItem) {
  const name =
    item.displayName ||
    (item.payload && (item.payload as any).entityName) ||
    item.entityId ||
    "—";
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

function DiffView({ item, compact }: { item: AuditItem; compact: boolean }) {
  // Fallback: algunos backends devuelven createdAt en lugar de ts
  const tsStr =
    (item as any).ts ??
    (item as any).createdAt ??
    (item as any).created_at ??
    null;

  const d = safeParseDate(tsStr);
  // Solo FECHA (sin hora) para la marca temporal del evento
  const when = d ? format(d, "dd MMM yyyy", { locale: es }) : "—";

  const actor = item.actorName || item.actorEmail || "—";
  const payload = ((item as any).payload ?? {}) as any;

  const isPlainObject = (o: any) =>
    o && typeof o === "object" && !Array.isArray(o);

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
      // Normalizamos por si el backend devuelve createdAt en lugar de ts
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
      const display = (it.displayName || "").toLowerCase();
      const any = `${actor} ${entity} ${display}`.includes(term);
      return any;
    });
  }, [items, q, action]);

  const [visible, setVisible] = useState(initialLimit);
  useEffect(() => setVisible(initialLimit), [initialLimit, proyectoId, q, action]);

  const shown = filtered.slice(0, visible);

  return (
    <div className={className}>
      {/* Controles de filtro (solo si enableFilter) */}
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
            className="w-36 rounded-lg border border-[rgb(var(--color-border))] bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
          >
            <option value="">Todas</option>
            <option value="create">Creación</option>
            <option value="update">Modificación</option>
            <option value="move">Movimiento</option>
            <option value="delete">Eliminación</option>
          </select>
        </div>
      )}

      {/* Lista */}
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

      {/* Paginación local + remota */}
      <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--color-border))] p-3">
        <button
          onClick={() => setVisible((v) => Math.max(initialLimit, v - initialLimit))}
          className="dark:text-white rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition disabled:opacity-50"
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
              className="rounded-lg border border-[rgb(var(--color-border))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/70 transition"
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
