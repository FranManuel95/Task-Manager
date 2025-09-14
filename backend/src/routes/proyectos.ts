import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { $Enums, Prisma } from "@prisma/client";

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

/* ---------------- Proyectos ---------------- */

// Lista (ligera)
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const proyectos = await db.proyecto.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        deadline: true,
        creadoPor: true,
        usuarios: true, // string[]
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
      usuarios: p.usuarios, // string[]
      tareas: { "por-hacer": [], "en-progreso": [], "completado": [] },
    }));

    res.json({ items, total: items.length, page: 1, pageSize: items.length });
  } catch (e) {
    next(e);
  }
});

// Detalle
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const p = await db.proyecto.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        deadline: true,
        creadoPor: true,
        usuarios: true, // string[]
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
      usuarios: p.usuarios, // string[]
      tareas,
    });
  } catch (e) {
    next(e);
  }
});

// Crear  ⬅️ usamos { set: [...] } y garantizamos al menos creadoPor
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    const creadoPor = (String(body.creadoPor ?? usuarios[0] ?? "system")).toLowerCase();

    // Para evitar problemas con arrays escalares en create:
    const finalUsuarios = Array.from(new Set(usuarios.length ? usuarios : [creadoPor]));

    const created = await db.proyecto.create({
      data: {
        nombre,
        descripcion,
        color,
        deadline,
        creadoPor,
        usuarios: { set: finalUsuarios }, // <- importante
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

// Editar
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
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

// Eliminar
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id.startsWith("temp-")) {
      return res.status(204).end();
    }

    const exists = await db.proyecto.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

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

/* ---------------- Colaboradores (NUEVO) ---------------- */

// Añadir colaborador (coincide con tu frontend: POST /:id/usuarios { usuario })
router.post("/:id/usuarios", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const usuarioRaw = req.body?.usuario;

    if (!usuarioRaw || typeof usuarioRaw !== "string") {
      return res.status(400).json({ error: "usuario requerido" });
    }
    const email = usuarioRaw.trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "usuario inválido" });

    const proj = await db.proyecto.findUnique({
      where: { id },
      select: { usuarios: true },
    });
    if (!proj) return res.status(404).json({ error: "Proyecto no encontrado" });

    if ((proj.usuarios ?? []).includes(email)) {
      // idempotente
      return res.status(204).end();
    }

    await db.proyecto.update({
      where: { id },
      data: { usuarios: { push: email } }, // Postgres array append
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// Quitar colaborador
router.delete("/:id/usuarios/:email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, email } = req.params;
    const target = decodeURIComponent(String(email || "")).trim().toLowerCase();
    if (!target) return res.status(400).json({ error: "email inválido" });

    const proj = await db.proyecto.findUnique({
      where: { id },
      select: { usuarios: true },
    });
    if (!proj) return res.status(404).json({ error: "Proyecto no encontrado" });

    const current = proj.usuarios ?? [];
    if (!current.includes(target)) {
      // no estaba: idempotente
      return res.status(204).end();
    }

    const next = current.filter((u) => u !== target);
    await db.proyecto.update({
      where: { id },
      data: { usuarios: { set: next } }, // reemplazo completo
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/* ---------------- Tareas ---------------- */

// Crear tarea
router.post("/:id/tareas", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: proyectoId } = req.params;

    const exists = await db.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true },
    });
    if (!exists) return res.status(404).json({ error: "Proyecto no encontrado" });

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

// Editar tarea
router.patch("/:id/tareas/:tareaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tareaId } = req.params;
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

// Mover tarea (acepta to/destino/estado)
router.post("/:id/tareas/move", async (req: Request, res: Response, next: NextFunction) => {
  try {
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

// **ELIMINAR tarea**
router.delete("/:id/tareas/:tareaId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: proyectoId, tareaId } = req.params;

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
    const { id: proyectoId } = req.params;

    const exists = await db.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true },
    });
    if (!exists) return res.status(404).json({ error: "Proyecto no encontrado" });

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
    const { id: proyectoId } = req.params;
    const { sender, text } = req.body ?? {};

    if (!sender || !text) {
      return res.status(400).json({ error: "sender y text son requeridos" });
    }

    const exists = await db.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true },
    });
    if (!exists) return res.status(404).json({ error: "Proyecto no encontrado" });

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
