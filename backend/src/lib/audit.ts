// backend/src/lib/audit.ts
import { db } from "../db";

type AuditParams = {
  proyectoId: string;
  entity: "proyecto" | "tarea" | "chat" | string;
  entityId?: string | null;
  action: "create" | "update" | "delete" | "move" | "add-collaborator" | "remove-collaborator" | string;
  actorEmail: string;
  /**
   * Nombre legible de la entidad (p.ej., título de tarea o nombre de proyecto).
   * Se guardará dentro de payload.entityName para que el front lo pueda mostrar.
   */
  entityName?: string | null;
  /**
   * Cualquier información adicional (before/after/diff, etc.)
   */
  payload?: unknown;
};

/**
 * Registro de auditoría “seguro”:
 * - Si la tabla no existe (entorno dev), no rompe la request.
 * - Fusiona `entityName` dentro del `payload` (payload.entityName).
 */
export async function auditLog(params: AuditParams) {
  try {
    // Algunos entornos pueden no tener la tabla auditLog
    if (!(db as any).auditLog) return;

    const mergedPayload =
      params.entityName || params.payload
        ? {
            ...(params.payload as any),
            ...(params.entityName ? { entityName: params.entityName } : {}),
          }
        : undefined;

    await (db as any).auditLog.create({
      data: {
        proyectoId: params.proyectoId,
        entity: params.entity,
        entityId: params.entityId ?? null,
        action: params.action,
        actorEmail: params.actorEmail,
        payload: mergedPayload,
      },
    });
  } catch (e) {
    // No rompemos la request si fallan los logs
    console.warn("auditLog failed:", e);
  }
}
