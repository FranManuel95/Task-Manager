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

/* ------------- A PARTIR DE AQUÍ: RUTAS PROTEGIDAS ------------- */
router.use(requireAuthUser);

/* ---------------- Proyectos ---------------- */

// Lista (solo proyectos donde soy colaborador)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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
      orderBy: { createdAt: "asc" },
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

// Detalle (solo si soy colaborador)
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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
          },
        },
      },
    });

    if (!p) return res.status(404).json({ error: "Proyecto no encontrado" });

    const tareas = {
      "por-hacer": [] as any[],
      "en-progreso": [] as any[],
      "completado": [] as any[],
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

// Crear — creadoPor = usuario en sesión; me aseguro de estar en usuarios
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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

// Editar — solo si soy colaborador
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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

// Eliminar — solo el creador; borra tareas y chat (como ya hacías)
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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
      db.proyecto.delete({ where: { id } }),
    ]);

    res.status(204).end();
  } catch (e: any) {
    if (e?.code === "P2025") {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    next(e);
  }
});

/* ---------------- Colaboradores ---------------- */

// Añadir colaborador — solo el creador
router.post("/:id/usuarios", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// Quitar colaborador — solo el creador
router.delete("/:id/usuarios/:email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/* ---------------- Tareas ---------------- */

// Crear tarea — solo si soy colaborador
router.post("/:id/tareas", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
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
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        deadline: true,
        etiquetas: true,
        estado: true,
      },
    });

    res.status(201).json({
      id: created.id,
      titulo: created.titulo,
      descripcion: created.descripcion ?? "",
      prioridad: created.prioridad,
      deadline: created.deadline ? created.deadline.toISOString() : null,
      etiquetas: created.etiquetas ?? [],
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

// Editar tarea — solo si soy colaborador
router.patch("/:id/tareas/:tareaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
    const { id: proyectoId, tareaId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const body = req.body ?? {};
    const data: Prisma.TareaUpdateInput = {};

    if (typeof body.titulo === "string") data.titulo = body.titulo;
    if (typeof body.descripcion === "string") data.descripcion = body.descripcion;
    if (typeof body.prioridad !== "undefined") {
      data.prioridad = toDbPrioridadFlexible(body.prioridad);
    }
    if (body.deadline !== undefined) data.deadline = parseDeadline(body.deadline);
    if (Array.isArray(body.etiquetas)) data.etiquetas = body.etiquetas as string[];

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
      },
    });

    res.json({
      id: updated.id,
      titulo: updated.titulo,
      descripcion: updated.descripcion ?? "",
      prioridad: updated.prioridad,
      deadline: updated.deadline ? updated.deadline.toISOString() : null,
      etiquetas: updated.etiquetas ?? [],
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

// Mover tarea — solo si soy colaborador
router.post("/:id/tareas/move", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
    const { id: proyectoId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const { tareaId } = req.body ?? {};
    const rawTo = req.body?.to ?? req.body?.destino ?? req.body?.estado;
    if (!tareaId) return res.status(400).json({ error: "tareaId requerido" });

    const dbTo = toDbEstadoFlexible(rawTo);
    if (!dbTo) return res.status(400).json({ error: "destino inválido" });

    const updated = await db.tarea.update({
      where: { id: String(tareaId) },
      data: { estado: dbTo },
      select: { id: true },
    });

    res.json({ ok: true, id: updated.id });
  } catch (e) {
    next(e);
  }
});

// Eliminar tarea — solo si soy colaborador
router.delete("/:id/tareas/:tareaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
    const { id: proyectoId, tareaId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    const result = await db.tarea.deleteMany({
      where: { id: tareaId, proyectoId },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/* ---------------- Chat ---------------- */

router.get("/:id/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.authUser!.email;
    const { id: proyectoId } = req.params;

    const membership = await ensureMember(proyectoId, email);
    if (!membership.ok) return res.status(membership.code).json({ error: "Forbidden" });

    try {
      const rows = await db.chatMessage.findMany({
        where: { proyectoId },
        orderBy: { id: "asc" },
      });

      const out = rows.map((m) => {
        const tsAny = (m as any).createdAt ?? (m as any).ts ?? new Date();
        return {
          id: m.id,
          proyectoId: m.proyectoId,
          sender: m.sender,
          text: m.text,
          ts: new Date(tsAny).toISOString(),
        };
      });

      res.json(out);
    } catch (err: any) {
      if (err?.code === "P2021") return res.json([]);
      throw err;
    }
  } catch (e) {
    next(e);
  }
});

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
        sender: String(sender).trim().toLowerCase(),
        text: String(text),
      },
    });

    const tsAny = (created as any).createdAt ?? (created as any).ts ?? new Date();

    res.status(201).json({
      id: created.id,
      proyectoId: created.proyectoId,
      sender: created.sender,
      text: created.text,
      ts: new Date(tsAny).toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
