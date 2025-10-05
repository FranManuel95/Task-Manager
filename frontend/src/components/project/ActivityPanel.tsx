import { useEffect, useState } from "react";
import { audit, type AuditItem } from "../../services/api";
import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

// Etiquetas legibles para cada campo del diff/snapshot
const FIELD_LABELS: Record<string, string> = {
  titulo: "título",
  descripcion: "descripción",
  prioridad: "prioridad",
  deadline: "fecha límite",
  estado: "estado",
  etiquetas: "etiquetas",
};

// Normaliza valores para mostrarlos (texto, fecha, arrays…)
function fmt(val: any): string {
  if (val == null) return "—";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "string") return val;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

// Título del evento (acción + entidad + nombre visible si hay)
function makeTitle(item: AuditItem) {
  const name =
    item.displayName ||
    (item.payload && (item.payload as any).entityName) ||
    item.entityId ||
    "—";

  // Mensajes más humanos por tipo de acción:
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

function DiffView({ item }: { item: AuditItem }) {
  const when = format(parseISO(item.ts), "dd MMM yyyy HH:mm", { locale: es });
  const actor = item.actorName || item.actorEmail;

  const payload = (item.payload || {}) as any;
  const diff = payload.diff as Record<string, { before: any; after: any }> | undefined;
  const before = payload.before;
  const after = payload.after;

  // Decide líneas a mostrar según la acción
  let rows: Array<{ label: string; before?: any; after?: any; type: "update" | "create" | "delete" }> =
    [];

  if (item.action === "update" || item.action === "move") {
    // Mostrar sólo campos que cambiaron
    if (diff && Object.keys(diff).length > 0) {
      rows = Object.entries(diff).map(([k, v]) => ({
        label: FIELD_LABELS[k] || k,
        before: v.before,
        after: v.after,
        type: "update" as const,
      }));
    }
  } else if (item.action === "create" && after) {
    // Para creaciones: enseñamos los campos iniciales (después)
    rows = Object.entries(after).map(([k, v]) => ({
      label: FIELD_LABELS[k] || k,
      after: v,
      type: "create" as const,
    }));
  } else if (item.action === "delete" && before) {
    // Para eliminaciones: enseñamos cómo estaba (antes)
    rows = Object.entries(before).map(([k, v]) => ({
      label: FIELD_LABELS[k] || k,
      before: v,
      type: "delete" as const,
    }));
  }

  return (
    <div className="p-3 flex items-start gap-3">
      <div className="text-gray-400">📝</div>
      <div className="flex-1">
        <div className="text-sm">
          <span className="font-medium">{makeTitle(item)}</span>{" "}
          <span className="text-gray-500">por {actor}</span>
        </div>

        {/* Líneas por campo */}
        {rows.length > 0 ? (
          <div className="mt-1 text-xs">
            {rows.map((r, idx) => {
              if (r.type === "update") {
                return (
                  <div key={idx} className="py-0.5">
                    <span className="font-medium">Modificación de {r.label}:</span>{" "}
                    <span className="line-through opacity-60 break-all">{fmt(r.before)}</span>{" "}
                    <span>→</span>{" "}
                    <span className="break-all">{fmt(r.after)}</span>
                  </div>
                );
              } else if (r.type === "create") {
                return (
                  <div key={idx} className="py-0.5">
                    <span className="font-medium">Valor inicial de {r.label}:</span>{" "}
                    <span className="break-all">{fmt(r.after)}</span>
                  </div>
                );
              } else {
                // delete
                return (
                  <div key={idx} className="py-0.5">
                    <span className="font-medium">Último valor de {r.label}:</span>{" "}
                    <span className="break-all">{fmt(r.before)}</span>
                  </div>
                );
              }
            })}
          </div>
        ) : null}

        {/* Si no hay diff ni snapshots, no mostramos detalles extra */}
        <div className="text-[11px] text-gray-400 mt-1">{when}</div>
      </div>
    </div>
  );
}

type Props = { proyectoId: string };

export default function ActivityPanel({ proyectoId }: Props) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (cur: string | null) => {
    setLoading(true);
    try {
      const res = await audit.list(proyectoId, { cursor: cur ?? undefined, limit: 50 });
      setItems((prev) => (cur ? [...prev, ...res.items] : res.items));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold mb-3">Actividad reciente</h3>

      <div className="bg-white border rounded-lg divide-y">
        {items.length === 0 && !loading && (
          <div className="p-4 text-sm text-gray-500">No hay actividad registrada.</div>
        )}

        {items.map((it) => (
          <DiffView key={it.id} item={it} />
        ))}

        {loading && <div className="p-3 text-sm text-gray-500">Cargando…</div>}
      </div>

      {nextCursor && (
        <button
          onClick={() => load(nextCursor)}
          className="mt-3 px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          Cargar más
        </button>
      )}
    </section>
  );
}
