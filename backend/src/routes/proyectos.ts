// backend/src/routes/proyectos.ts
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { $Enums, Prisma } from "@prisma/client";
import { requireAuthUser } from "../middleware/requireAuth";

const router = Router();

/* ---------------- Utilidades ---------------- */

type FrontEstado = "por-hacer" | "en-progreso" | "completado";
type DbEstado = $Enums.Estado;
type DbPrioridad = $Enums.Prioridad;

function toDbEstadoFlexible(value: unknown): DbEstado | null {
  const s = String(value ?? "").trim().toLowerCase();
  const map: Record<string, DbEstado> = {
    "por-hacer": "por_hacer",
    "por_hacer": "por_hacer",
    "en-progreso": "en_progreso",
    "en_progreso": "en_progreso",
    "completado": "completado",
  };
  return map[s] ?? null;
}

function toDbPrioridadFlexible(value: unknown): DbPrioridad {
  const s = String(value ?? "").trim().toLowerCase();
  return (["baja", "media", "alta"] as const).includes(s as DbPrioridad)
    ? (s as DbPrioridad)
    : "media";
}

function parseDeadline(d: unknown): Date | null {
  if (!d) return null;
  const dt = new Date(String(d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/* --- snapshots y diffs para logs --- */
function tareaSnapshot(t: {
  titulo: string;
  descripcion: string | null;
  prioridad: $Enums.Prioridad;
  deadline: Date | null;
  estado: $Enums.Estado;
  etiquetas: string[] | null;
}) {
  return {
    titulo: t.titulo,
    descripcion: t.descripcion ?? "",
    prioridad: t.prioridad,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    estado: t.estado,
    etiquetas: t.etiquetas ?? [],
  };
}

function computeDiff(before: any, after: any) {
  const out: Record<string, { before: any; after: any }> = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const k of keys) {
    const b = before?.[k];
    const a = after?.[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) out[k] = { before: b, after: a };
  }
  return out;
}

/* ---- Unión discriminada para evitar el error en membership.code ---- */
type Membership =
  | { ok: true; proj: { id: string; usuarios: string[] | null; creadoPor: string } }
  | { ok: false; code: 403 | 404 };

async function ensureMember(proyectoId: string, email: string): Promise<Membership> {
  const proj = await db.proyecto.findUnique({
    where: { id: proyectoId },
    select: { id: true, usuarios: true, creadoPor: true },
  });
  if (!proj) return { ok: false, code: 404 } as const;
  if (!(proj.usuarios ?? []).includes(email)) return { ok: false, code: 403 } as const;
  return { ok: true, proj } as const;
}

/* ---------- Log de auditoría (seguro) ---------- */
async function auditLogSafe(params: {
  proyectoId: string;
  entity: "proyecto" | "tarea" | "chat" | string;
  action:
    | "create"
    | "update"
    | "delete"
    | "move"
    | "add-collaborator"
    | "remove-collaborator"
    | string;
  actorEmail: string;
  entityId?: string | null;
  entityName?: string | null;
  payload?: unknown;
}) {
  try {
    if (!(db as any).auditLog) return;

    const mergedPayload =
      params.entityName || params.payload
        ? { ...(params.payload as any), ...(params.entityName ? { entityName: params.entityName } : {}) }
        : undefined;

    await (db as any).auditLog.create({
      data: {
        proyectoId: params.proyectoId,
        entity: params.entity,
        entityId: params.entityId ?? null,
        action: params.action,
        actorEmail: params.actorEmail,
        payload: mergedPayload as any,
      },
    });
  } catch (e) {
    console.warn("auditLogSafe fallo:", e);
  }
}

/* ------------- A PARTIR DE AQUÍ: RUTAS PROTEGIDAS ------------- */
router.use(requireAuthUser);

/* ---------------- Proyectos ---------------- */

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const proyectos = await db.proyecto.findMany({
      where: { usuarios: { has: email } },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        deadline: true,
        creadoPor: true,
        usuarios: true,
      },
      orderBy: { createdAt: "asc" }, // o { id: "asc" }
    });

    const items = proyectos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      color: p.color,
      deadline: p.deadline ? p.deadline.toISOString() : null,
      creadoPor: p.creadoPor,
      usuarios: p.usuarios,
      tareas: { "por-hacer": [], "en-progreso": [], "completado": [] },
    }));

    res.json({ items, total: items.length, page: 1, pageSize: items.length });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id } = req.params;

    const p = await db.proyecto.findFirst({
      where: { id, usuarios: { has: email } },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        deadline: true,
        creadoPor: true,
        usuarios: true,
        tareas: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            prioridad: true,
            deadline: true,
            etiquetas: true,
            estado: true,
            createdBy: true,
            updatedBy: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!p) return res.status(404).json({ error: "Proyecto no encontrado" });

    const emailsSet = new Set<string>();
    for (const t of p.tareas) {
      if (t.createdBy) emailsSet.add(t.createdBy);
      if (t.updatedBy) emailsSet.add(t.updatedBy);
    }
    const emails = Array.from(emailsSet);
    const users = emails.length
      ? await db.user.findMany({
          where: { email: { in: emails as string[] } },
          select: { email: true, name: true },
        })
      : [];
    const nameByEmail = Object.fromEntries(users.map((u) => [u.email, u.name]));

    const tareas = {
      "por-hacer": [] as any[],
      "en-progreso": [] as any[],
      completado: [] as any[],
    };

    for (const t of p.tareas) {
      const front: FrontEstado =
        t.estado === "por_hacer"
          ? "por-hacer"
          : t.estado === "en_progreso"
          ? "en-progreso"
          : "completado";

      tareas[front].push({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion ?? "",
        prioridad: t.prioridad,
        deadline: t.deadline ? t.deadline.toISOString() : null,
        etiquetas: t.etiquetas ?? [],
        createdBy: t.createdBy ?? null,
        createdByName: t.createdBy ? nameByEmail[t.createdBy] ?? null : null,
        updatedBy: t.updatedBy ?? null,
        updatedByName: t.updatedBy ? nameByEmail[t.updatedBy] ?? null : null,
        updatedAt: t.updatedAt ? t.updatedAt.toISOString() : null,
      });
    }

    res.json({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      color: p.color,
      deadline: p.deadline ? p.deadline.toISOString() : null,
      creadoPor: p.creadoPor,
      usuarios: p.usuarios,
      tareas,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const body = req.body ?? {};
    const nombre = String(body.nombre ?? "").trim();
    const descripcion = String(body.descripcion ?? "");
    const color = String(body.color ?? "#3B82F6").trim();
    const deadline = parseDeadline(body.deadline);
    const usuariosArr = Array.isArray(body.usuarios) ? (body.usuarios as unknown[]) : [];

    if (!nombre || !color) {
      return res.status(400).json({ error: "nombre y color son requeridos" });
    }

    const usuarios: string[] = usuariosArr
      .map((u) => String(u || "").trim().toLowerCase())
      .filter(Boolean);

    const finalUsuarios = Array.from(new Set([email, ...usuarios]));

    const created = await db.proyecto.create({
      data: {
        nombre,
        descripcion,
        color,
        deadline,
        creadoPor: email,
        usuarios: { set: finalUsuarios },
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        deadline: true,
        creadoPor: true,
        usuarios: true,
      },
    });

    auditLogSafe({
      proyectoId: created.id,
      entity: "proyecto",
      entityId: created.id,
      action: "create",
      actorEmail: email,
      payload: { nombre, color, deadline },
    });

    res.status(201).json({
      id: created.id,
      nombre: created.nombre,
      descripcion: created.descripcion ?? "",
      color: created.color,
      deadline: created.deadline ? created.deadline.toISOString() : null,
      creadoPor: created.creadoPor,
      usuarios: created.usuarios,
      tareas: { "por-hacer": [], "en-progreso": [], "completado": [] },
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id } = req.params;

    const membership = await ensureMember(id, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const body = req.body ?? {};
    const data: Prisma.ProyectoUpdateInput = {};
    if (typeof body.nombre === "string") data.nombre = body.nombre;
    if (typeof body.descripcion === "string") data.descripcion = body.descripcion;
    if (typeof body.color === "string") data.color = body.color;
    if (body.deadline !== undefined) data.deadline = parseDeadline(body.deadline);

    const updated = await db.proyecto.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        deadline: true,
        creadoPor: true,
        usuarios: true,
      },
    });

    auditLogSafe({
      proyectoId: id,
      entity: "proyecto",
      entityId: id,
      action: "update",
      actorEmail: email,
      payload: body,
    });

    res.json({
      id: updated.id,
      nombre: updated.nombre,
      descripcion: updated.descripcion ?? "",
      color: updated.color,
      deadline: updated.deadline ? updated.deadline.toISOString() : null,
      creadoPor: updated.creadoPor,
      usuarios: updated.usuarios,
    });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id } = req.params;

    if (id.startsWith("temp-")) {
      return res.status(204).end();
    }

    const proj = await db.proyecto.findUnique({
      where: { id },
      select: { id: true, creadoPor: true },
    });
    if (!proj) return res.status(404).json({ error: "Proyecto no encontrado" });
    if (proj.creadoPor !== email) return res.status(403).json({ error: "Forbidden" });

    await db.$transaction([
      db.tarea.deleteMany({ where: { proyectoId: id } }),
      db.chatMessage.deleteMany({ where: { proyectoId: id } }),
      db.chatThread.deleteMany({ where: { proyectoId: id } }),
      db.proyecto.delete({ where: { id } }),
    ]);

    auditLogSafe({
      proyectoId: id,
      entity: "proyecto",
      entityId: id,
      action: "delete",
      actorEmail: email,
    });

    res.status(204).end();
  } catch (e: any) {
    if (e?.code === "P2025") {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    next(e);
  }
});

/* ---------------- Colaboradores ---------------- */

router.post("/:id/usuarios", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id } = req.params;
    const usuarioRaw = req.body?.usuario;

    if (!usuarioRaw || typeof usuarioRaw !== "string") {
      return res.status(400).json({ error: "usuario requerido" });
    }
    const toAdd = usuarioRaw.trim().toLowerCase();
    if (!toAdd) return res.status(400).json({ error: "usuario inválido" });

    const proj = await db.proyecto.findUnique({
      where: { id },
      select: { usuarios: true, creadoPor: true },
    });
    if (!proj) return res.status(404).json({ error: "Proyecto no encontrado" });
    if (proj.creadoPor !== email) return res.status(403).json({ error: "Forbidden" });

    if ((proj.usuarios ?? []).includes(toAdd)) {
      return res.status(204).end();
    }

    await db.proyecto.update({
      where: { id },
      data: { usuarios: { push: toAdd } },
    });

    auditLogSafe({
      proyectoId: id,
      entity: "proyecto",
      entityId: id,
      action: "add-collaborator",
      actorEmail: email,
      payload: { collaborator: toAdd },
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.delete("/:id/usuarios/:email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id } = req.params;
    const target = decodeURIComponent(String(req.params.email || "")).trim().toLowerCase();
    if (!target) return res.status(400).json({ error: "email inválido" });

    const proj = await db.proyecto.findUnique({
      where: { id },
      select: { usuarios: true, creadoPor: true },
    });
    if (!proj) return res.status(404).json({ error: "Proyecto no encontrado" });
    if (proj.creadoPor !== email) return res.status(403).json({ error: "Forbidden" });

    const current = proj.usuarios ?? [];
    if (!current.includes(target)) {
      return res.status(204).end();
    }

    const next = current.filter((u) => u !== target);
    await db.proyecto.update({
      where: { id },
      data: { usuarios: { set: next } },
    });

    auditLogSafe({
      proyectoId: id,
      entity: "proyecto",
      entityId: id,
      action: "remove-collaborator",
      actorEmail: email,
      payload: { collaborator: target },
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/* ---------------- Tareas ---------------- */

router.post("/:id/tareas", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id: proyectoId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const body = req.body ?? {};
    const titulo = String(body.titulo ?? "").trim();
    if (!titulo) return res.status(400).json({ error: "titulo requerido" });

    const dbEstado = toDbEstadoFlexible(body.estado ?? "por-hacer");
    if (!dbEstado) return res.status(400).json({ error: "estado inválido" });

    const prioridad = toDbPrioridadFlexible(body.prioridad);

    const created = await db.tarea.create({
      data: {
        proyectoId,
        titulo,
        descripcion: String(body.descripcion ?? ""),
        prioridad,
        deadline: parseDeadline(body.deadline),
        etiquetas: Array.isArray(body.etiquetas) ? (body.etiquetas as string[]) : [],
        estado: dbEstado,
        createdBy: email,
        updatedBy: email,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        deadline: true,
        etiquetas: true,
        estado: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    auditLogSafe({
      proyectoId,
      entity: "tarea",
      entityId: created.id,
      entityName: created.titulo,
      action: "create",
      actorEmail: email,
      payload: {
        after: {
          titulo: created.titulo,
          descripcion: created.descripcion ?? "",
          prioridad: created.prioridad,
          deadline: created.deadline ? created.deadline.toISOString() : null,
          estado: created.estado,
          etiquetas: created.etiquetas ?? [],
        },
      },
    });

    res.status(201).json({
      id: created.id,
      titulo: created.titulo,
      descripcion: created.descripcion ?? "",
      prioridad: created.prioridad,
      deadline: created.deadline ? created.deadline.toISOString() : null,
      etiquetas: created.etiquetas ?? [],
      createdBy: created.createdBy ?? null,
      updatedBy: created.updatedBy ?? null,
      estado:
        created.estado === "por_hacer"
          ? "por-hacer"
          : created.estado === "en_progreso"
          ? "en-progreso"
          : "completado",
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/tareas/:tareaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id: proyectoId, tareaId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const beforeRow = await db.tarea.findUnique({
      where: { id: tareaId },
      select: {
        titulo: true,
        descripcion: true,
        prioridad: true,
        deadline: true,
        estado: true,
        etiquetas: true,
      },
    });
    if (!beforeRow) return res.status(404).json({ error: "Tarea no encontrada" });
    const before = tareaSnapshot(beforeRow);

    const body = req.body ?? {};
    const data: Prisma.TareaUpdateInput = {};
    if (typeof body.titulo === "string") data.titulo = body.titulo;
    if (typeof body.descripcion === "string") data.descripcion = body.descripcion;
    if (typeof body.prioridad !== "undefined") data.prioridad = toDbPrioridadFlexible(body.prioridad);
    if (body.deadline !== undefined) data.deadline = parseDeadline(body.deadline);
    if (Array.isArray(body.etiquetas)) data.etiquetas = body.etiquetas as string[];
    (data as any).updatedBy = email;

    const updated = await db.tarea.update({
      where: { id: tareaId },
      data,
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        deadline: true,
        etiquetas: true,
        estado: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    const after = {
      titulo: updated.titulo,
      descripcion: updated.descripcion ?? "",
      prioridad: updated.prioridad,
      deadline: updated.deadline ? updated.deadline.toISOString() : null,
      estado: updated.estado,
      etiquetas: updated.etiquetas ?? [],
    };
    const diff = computeDiff(before, after);

    auditLogSafe({
      proyectoId,
      entity: "tarea",
      entityId: updated.id,
      entityName: updated.titulo,
      action: "update",
      actorEmail: email,
      payload: { before, after, diff },
    });

    res.json({
      id: updated.id,
      titulo: updated.titulo,
      descripcion: updated.descripcion ?? "",
      prioridad: updated.prioridad,
      deadline: updated.deadline ? updated.deadline.toISOString() : null,
      etiquetas: updated.etiquetas ?? [],
      createdBy: updated.createdBy ?? null,
      updatedBy: updated.updatedBy ?? null,
      estado:
        updated.estado === "por_hacer"
          ? "por-hacer"
          : updated.estado === "en_progreso"
          ? "en-progreso"
          : "completado",
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/tareas/move", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id: proyectoId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const { tareaId } = req.body ?? {};
    const rawTo = req.body?.to ?? req.body?.destino ?? req.body?.estado;
    if (!tareaId) return res.status(400).json({ error: "tareaId requerido" });

    const dbTo = toDbEstadoFlexible(rawTo);
    if (!dbTo) return res.status(400).json({ error: "destino inválido" });

    const beforeRow = await db.tarea.findUnique({
      where: { id: String(tareaId) },
      select: { titulo: true, descripcion: true, prioridad: true, deadline: true, estado: true, etiquetas: true },
    });
    if (!beforeRow) return res.status(404).json({ error: "Tarea no encontrada" });
    const before = tareaSnapshot(beforeRow);

    const updated = await db.tarea.update({
      where: { id: String(tareaId) },
      data: { estado: dbTo, updatedBy: email },
      select: { id: true, estado: true, titulo: true, descripcion: true, prioridad: true, deadline: true, etiquetas: true },
    });

    const after = {
      titulo: updated.titulo,
      descripcion: updated.descripcion ?? "",
      prioridad: updated.prioridad,
      deadline: updated.deadline ? updated.deadline.toISOString() : null,
      estado: updated.estado,
      etiquetas: updated.etiquetas ?? [],
    };
    const diff = computeDiff(before, after);

    auditLogSafe({
      proyectoId,
      entity: "tarea",
      entityId: String(tareaId),
      entityName: updated.titulo,
      action: "move",
      actorEmail: email,
      payload: { before, after, diff },
    });

    res.json({ ok: true, id: updated.id });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id/tareas/:tareaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id: proyectoId, tareaId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const beforeRow = await db.tarea.findFirst({
      where: { id: tareaId, proyectoId },
      select: { titulo: true, descripcion: true, prioridad: true, deadline: true, estado: true, etiquetas: true },
    });
    const before = beforeRow ? tareaSnapshot(beforeRow) : null;

    const result = await db.tarea.deleteMany({
      where: { id: tareaId, proyectoId },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    auditLogSafe({
      proyectoId,
      entity: "tarea",
      entityId: tareaId,
      entityName: beforeRow?.titulo ?? null,
      action: "delete",
      actorEmail: email,
      payload: { before },
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/* ---------------- Chat (general por proyecto) ---------------- */

// GET /api/proyectos/:id/chat  -> SOLO canal general (threadId NULL)
router.get("/:id/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
    const { id: proyectoId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    try {
      const rows = await db.chatMessage.findMany({
        where: { proyectoId, threadId: null },
        orderBy: { createdAt: "asc" },
      });

      const out = rows.map((m) => ({
        id: m.id,
        proyectoId: m.proyectoId,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      }));

      res.json(out);
    } catch (err: any) {
      if (err?.code === "P2021") return res.json([]); // tabla no existe -> vacío
      throw err;
    }
  } catch (e) {
    next(e);
  }
});

// POST /api/proyectos/:id/chat  -> fuerza threadId NULL (canal general)
router.post("/:id/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
    const { id: proyectoId } = req.params;
    const { sender, text } = req.body ?? {};

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    if (!sender || !text) {
      return res.status(400).json({ error: "sender y text son requeridos" });
    }

    const created = await db.chatMessage.create({
      data: {
        proyectoId,
        threadId: null, // 🔒 asegurar que va al canal general
        sender: String(sender).trim().toLowerCase(),
        text: String(text),
      },
    });

    res.status(201).json({
      id: created.id,
      proyectoId: created.proyectoId,
      sender: created.sender,
      text: created.text,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/audit", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email.toLowerCase();
    const { id: proyectoId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Math.max(1, Math.min(limitRaw, 100));
    const cursor = req.query.cursor ? String(req.query.cursor) : null;

    if (!(db as any).auditLog) return res.json({ items: [], nextCursor: null });

    try {
      const rows = await (db as any).auditLog.findMany({
        where: { proyectoId },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          createdAt: true,
          proyectoId: true,
          entity: true,
          entityId: true,
          action: true,
          actorEmail: true,
          payload: true,
        },
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      const emails: string[] = Array.from(
        new Set<string>(items.map((r: any) => String(r.actorEmail ?? "")).filter(Boolean))
      );
      const users = emails.length
        ? await db.user.findMany({
            where: { email: { in: emails } },
            select: { email: true, name: true },
          })
        : [];
      const nameByEmail = Object.fromEntries(users.map((u) => [u.email, u.name]));

      const needTitle = items.filter(
        (r: any) => r.entity === "tarea" && r.entityId && !(r.payload as any)?.entityName
      );
      let titleById: Record<string, string> = {};
      if (needTitle.length) {
        const ids: string[] = Array.from(new Set(needTitle.map((r: any) => String(r.entityId))));
        const tareasRows = await db.tarea.findMany({
          where: { id: { in: ids } },
          select: { id: true, titulo: true },
        });
        titleById = Object.fromEntries(tareasRows.map((t) => [t.id, t.titulo]));
      }

      res.json({
        items: items.map((r: any) => {
          const pld = r.payload as any;
          const displayName =
            pld?.entityName ??
            (r.entity === "tarea" && r.entityId ? titleById[String(r.entityId)] ?? null : null);

          return {
            id: r.id,
            createdAt: r.createdAt.toISOString(),
            proyectoId: r.proyectoId,
            entity: r.entity,
            entityId: r.entityId,
            action: r.action,
            actorEmail: r.actorEmail,
            actorName: nameByEmail[r.actorEmail] ?? null,
            displayName,
            payload: pld,
          };
        }),
        nextCursor: hasMore ? items[items.length - 1].id : null,
      });
    } catch (err: any) {
      if (err?.code === "P2021") {
        return res.json({ items: [], nextCursor: null });
      }
      throw err;
    }
  } catch (e) {
    next(e);
  }
});

/* ---------------- Chat Threads (privados) ---------------- */

/**
 * Admite 3 formatos de "thread id":
 *  - UUID real de ChatThread.id
 *  - "dm::<email1>::<email2>"
 *  - "<proyectoId>::dm::<email1>::<email2>"
 *
 * Devuelve un ChatThread.id real (creándolo si hace falta).
 */
async function resolveThreadId(
  proyectoId: string,
  rawThreadId: string,
  meEmail: string
): Promise<string> {
  const raw = decodeURIComponent(String(rawThreadId || "").trim());

  // 1) ¿Es un UUID/ID real?
  try {
    const byId = await db.chatThread.findUnique({ where: { id: raw } });
    if (byId) return byId.id;
  } catch {
    // ignoramos error y probamos formato virtual
  }

  // 2) ¿Es un ID "virtual" de DM?
  //    Aceptamos "dm::a@x::b@y" o "<proyectoId>::dm::a@x::b@y"
  const m = raw.match(/(?:^|::)dm::([^:]+)::([^:]+)$/i);
  if (!m) {
    const err: any = new Error("THREAD_NOT_FOUND");
    err.code = "THREAD_NOT_FOUND";
    throw err;
  }

  // Normalizar participantes
  const e1 = String(m[1]).trim().toLowerCase();
  const e2 = String(m[2]).trim().toLowerCase();
  const participants = Array.from(new Set([e1, e2])).sort();

  // 3) Seguridad: ambos deben pertenecer al proyecto
  const proj = await db.proyecto.findUnique({
    where: { id: proyectoId },
    select: { usuarios: true },
  });
  const usuarios = proj?.usuarios ?? [];
  const allInProject = participants.every((p) => usuarios.includes(p));
  if (!allInProject) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  // 4) Buscar/crear el hilo privado
  let thread = await db.chatThread.findFirst({
    where: {
      proyectoId,
      isPrivate: true,
      participants: { hasEvery: participants },
    },
  });

  if (!thread) {
    thread = await db.chatThread.create({
      data: {
        proyectoId,
        isPrivate: true,
        participants,
      },
    });
  }

  return thread.id;
}

// Obtener o crear un hilo privado entre dos usuarios
router.get("/:id/chat/thread/:targetEmail", async (req, res, next) => {
  try {
    const { id: proyectoId, targetEmail } = req.params;
    const email = req.authUser!.email.toLowerCase();

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const other = String(targetEmail || "").trim().toLowerCase();
    if (!other) return res.status(400).json({ error: "Email destino requerido" });

    // Ambos deben ser miembros
    const proj = await db.proyecto.findUnique({ where: { id: proyectoId }, select: { usuarios: true } });
    const usuarios = proj?.usuarios ?? [];
    if (!usuarios.includes(other)) return res.status(403).json({ error: "Forbidden" });

    let thread = await db.chatThread.findFirst({
      where: {
        proyectoId,
        isPrivate: true,
        participants: { hasEvery: [email, other] },
      },
    });

    if (!thread) {
      thread = await db.chatThread.create({
        data: {
          proyectoId,
          isPrivate: true,
          participants: [email, other].sort(),
        },
      });
    }

    res.json(thread);
  } catch (e) {
    next(e);
  }
});

// Obtener mensajes de un hilo (acepta id real o "virtual" dm::a::b)
router.get("/:id/chat/thread/:threadId/messages", async (req, res, next) => {
  try {
    const { id: proyectoId, threadId } = req.params;
    const email = req.authUser!.email.toLowerCase();

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const realId = await resolveThreadId(proyectoId, threadId, email);

    const msgs = await db.chatMessage.findMany({
      where: { proyectoId, threadId: realId },
      orderBy: { createdAt: "asc" },
    });

    res.json(
      msgs.map((m) => ({
        id: m.id,
        proyectoId: m.proyectoId,
        sender: m.sender,
        text: m.text,
        ts: m.createdAt.toISOString(),
      }))
    );
  } catch (e: any) {
    if (e?.code === "THREAD_NOT_FOUND") {
      return res.status(404).json({ error: "Thread no encontrado" });
    }
    if (e?.status) {
      return res.status(e.status).json({ error: e.message || "Forbidden" });
    }
    next(e);
  }
});

// Enviar mensaje a un hilo (acepta id real o "virtual" dm::a::b)
router.post("/:id/chat/thread/:threadId/messages", async (req, res, next) => {
  try {
    const { id: proyectoId, threadId } = req.params;
    const email = req.authUser!.email.toLowerCase();
    const { text } = req.body ?? {};

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Texto requerido" });
    }

    const realId = await resolveThreadId(proyectoId, threadId, email);

    const created = await db.chatMessage.create({
      data: {
        proyectoId,
        threadId: realId,
        sender: email,
        text: text.trim(),
      },
    });

    res.status(201).json({
      id: created.id,
      proyectoId: created.proyectoId,
      sender: created.sender,
      text: created.text,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (e: any) {
    if (e?.code === "THREAD_NOT_FOUND") {
      return res.status(404).json({ error: "Thread no encontrado" });
    }
    if (e?.status) {
      return res.status(e.status).json({ error: e.message || "Forbidden" });
    }
    next(e);
  }
});

/* --------- Alias para cuadrar con /chat/threads/:threadId --------- */

router.get("/:id/chat/threads/:threadId", async (req, res, next) => {
  (req as any).params.threadId = req.params.threadId;
  (req as any).method = "GET";
  (req as any).url = `/${req.params.id}/chat/thread/${req.params.threadId}/messages`;
  return (router as any).handle(req, res, next);
});

router.post("/:id/chat/threads/:threadId", async (req, res, next) => {
  (req as any).params.threadId = req.params.threadId;
  (req as any).method = "POST";
  (req as any).url = `/${req.params.id}/chat/thread/${req.params.threadId}/messages`;
  return (router as any).handle(req, res, next);
});

export default router;
