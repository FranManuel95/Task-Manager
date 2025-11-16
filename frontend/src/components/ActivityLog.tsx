// src/components/ActivityLog.tsx
import { useEffect, useState } from "react";
import { api, type AuditItem } from "../services/api";
import { fromNow } from "../lib/date";

// Obtiene un nombre legible de la entidad aunque haya cambiado
function deriveEntityName(it: AuditItem): string {
  const payload = ((it as any)?.payload ?? {}) as any;
  const diff = payload?.diff ?? {};
  const before = payload?.before ?? {};
  const after = payload?.after ?? {};

  // Preferimos el estado "after" (actual), luego "before", luego diff.
  const nameAfter = after?.nombre || after?.titulo || after?.entityName;
  if (nameAfter) return String(nameAfter);

  const nameBefore = before?.nombre || before?.titulo || before?.entityName;
  if (nameBefore) return String(nameBefore);

  const nameDiff =
    diff?.nombre?.after || diff?.titulo?.after || diff?.entityName?.after;
  if (nameDiff) return String(nameDiff);

  return (
    (it as any).displayName ||
    (payload && payload.entityName) ||
    it.entityId || // último recurso: id
    "—"
  );
}

// Intenta sacar un timestamp válido para fromNow
function getTs(it: AuditItem): string | null {
  const anyIt = it as any;
  return anyIt.ts ?? anyIt.createdAt ?? anyIt.created_at ?? null;
}

type Props = { proyectoId: string };

export default function ActivityLog({ proyectoId }: Props) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.getAudit(proyectoId);
        if (!abort) setItems(data);
      } catch {
        if (!abort) setItems([]);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [proyectoId]);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-[rgb(var(--color-border))] p-4">
      <h3 className="font-semibold mb-3 dark:text-neutral-100">
        Actividad reciente
      </h3>

      {loading && (
        <p className="text-sm text-gray-500 dark:text-neutral-400">Cargando…</p>
      )}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-neutral-400">
          Sin actividad.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((it) => {
          const ts = getTs(it);
          const when = ts ? fromNow(ts) : "";
          const actor = it.actorName || it.actorEmail || "—";
          return (
            <li
              key={it.id}
              className="text-sm text-gray-800 dark:text-neutral-200"
            >
              <span className="font-medium">{actor}</span> {renderAction(it)}{" "}
              <span className="text-xs text-gray-500 dark:text-neutral-400">
                • {when}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function renderAction(it: AuditItem) {
  const entity = it.entity; // "proyecto" | "tarea" | "chat" | ...
  const idShort = it.entityId ? `#${it.entityId.slice(0, 6)}` : "";
  const act = it.action; // "create" | "update" | "delete" | "move" | ...
  const name = deriveEntityName(it);

  // acceso al payload para detalles (p. ej. movimientos)
  const payload = ((it as any).payload ?? {}) as any;
  const diff = payload?.diff ?? {};
  const before = payload?.before ?? {};
  const after = payload?.after ?? {};

  // Si es tarea y hay movimiento de estado/columna, intentamos mostrar "de → a"
  const movedFrom =
    diff?.estado?.before ??
    diff?.column?.before ??
    before?.estado ??
    before?.column ??
    null;

  const movedTo =
    diff?.estado?.after ??
    diff?.column?.after ??
    after?.estado ??
    after?.column ??
    null;

  // Mensajes legibles y consistentes
  if (entity === "tarea") {
    if (act === "create")
      return (
        <>
          creó la tarea <span className="font-medium">“{name}”</span>{" "}
          <span className="opacity-70">{idShort}</span>
        </>
      );
    if (act === "update")
      return (
        <>
          editó la tarea <span className="font-medium">“{name}”</span>{" "}
          <span className="opacity-70">{idShort}</span>
        </>
      );
    if (act === "delete")
      return (
        <>
          eliminó la tarea <span className="font-medium">“{name}”</span>{" "}
          <span className="opacity-70">{idShort}</span>
        </>
      );
    if (act === "move") {
      if (movedFrom && movedTo && movedFrom !== movedTo) {
        return (
          <>
            movió la tarea <span className="font-medium">“{name}”</span> de{" "}
            <span className="italic">{prettyEstado(movedFrom)}</span> a{" "}
            <span className="italic">{prettyEstado(movedTo)}</span>{" "}
            <span className="opacity-70">{idShort}</span>
          </>
        );
      }
      return (
        <>
          movió la tarea <span className="font-medium">“{name}”</span>{" "}
          <span className="opacity-70">{idShort}</span>
        </>
      );
    }
  }

  if (entity === "proyecto") {
    if (act === "create")
      return (
        <>
          creó el proyecto <span className="font-medium">“{name}”</span>
        </>
      );
    if (act === "update")
      return (
        <>
          editó el proyecto <span className="font-medium">“{name}”</span>
        </>
      );
    if (act === "delete")
      return (
        <>
          eliminó el proyecto <span className="font-medium">“{name}”</span>
        </>
      );
  }

  if (entity === "chat") {
    if (act === "create") return <>envió un mensaje</>;
  }

  // genérico (fallback)
  return (
    <>
      realizó {act} en {entity} <span className="font-medium">“{name}”</span>{" "}
      <span className="opacity-70">{idShort}</span>
    </>
  );
}

// Bonito para estados/columnas
function prettyEstado(val: string) {
  const map: Record<string, string> = {
    "por-hacer": "Por hacer",
    "en-progreso": "En progreso",
    bloqueado: "Bloqueado",
    completado: "Completado",
  };
  return map[val] ?? val;
}
