import { useEffect, useState } from "react";
import { api, type AuditItem } from "../services/api";
import { fromNow } from "../lib/date";

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
    return () => { abort = true; };
  }, [proyectoId]);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-3">Actividad reciente</h3>
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500">Sin actividad.</p>
      )}
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="text-sm text-gray-700">
            <span className="font-medium">{it.actorEmail}</span>{" "}
            {renderAction(it)}{" "}
           
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderAction(it: AuditItem) {
  const entity = it.entity; // "proyecto" | "tarea" | "chat" | ...
  const id = it.entityId ? `#${it.entityId.slice(0, 6)}` : "";
  const act = it.action; // "create" | "update" | "delete" | "move" | ...

  // mensajes simples y legibles
  if (entity === "tarea") {
    if (act === "create") return <>creó una tarea {id}</>;
    if (act === "update") return <>editó la tarea {id}</>;
    if (act === "delete") return <>eliminó la tarea {id}</>;
    if (act === "move")   return <>movió la tarea {id}</>;
  }
  if (entity === "proyecto") {
    if (act === "update") return <>editó el proyecto</>;
    if (act === "delete") return <>eliminó el proyecto</>;
  }
  if (entity === "chat") {
    if (act === "create") return <>envió un mensaje</>;
  }
  return <>realizó {act} en {entity} {id}</>;
}
