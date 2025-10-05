// backend/src/lib/audit.ts
import { db } from "../db";

type AuditParams = {
  proyectoId: string;
  entity: "proyecto" | "tarea" | "chat" | string;
  entityId?: string;
  action: "create" | "update" | "delete" | "move" | string;
  actorEmail: string;
  payload?: unknown;
};

export async function auditLog(params: AuditParams) {
  try {
    await db.auditLog.create({
      data: {
        proyectoId: params.proyectoId,
        entity: params.entity,
        entityId: params.entityId ?? null,
        action: params.action,
        actorEmail: params.actorEmail,
        payload: params.payload ? (params.payload as any) : undefined,
      },
    });
  } catch (e) {
    // No rompemos la request si fallan los logs
    console.warn("auditLog failed:", e);
  }
}
