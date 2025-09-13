import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { v4 as uuid } from "uuid";

/**
 * Tipos (documentación):
 * - Estado: "por-hacer" | "en-progreso" | "completado"
 * - Prioridad: "alta" | "media" | "baja"
 * - Tarea: { id, titulo, descripcion, prioridad, deadline|null, etiquetas[] }
 * - Proyecto: {
 *     id, nombre, descripcion, color, deadline|null,
 *     creadoPor: string,
 *     usuarios: string[],
 *     tareas: Record<Estado, Tarea[]>
 *   }
 * - ChatMessage: { id, proyectoId, sender, text, ts, edited? }
 */

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Si alguna vez accedes sin proxy de Vite, CORS te ayudará:
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ---- DB en memoria ----
/** @type {Map<string, any>} */
const proyectos = new Map();
/** @type {Map<string, Array<any>>} */
const chatsByProyecto = new Map();

function ensureProyecto(id) {
  const p = proyectos.get(id);
  if (!p) {
    const err = new Error("Proyecto no encontrado");
    err.status = 404;
    throw err;
  }
  // asegura columnas
  p.tareas = p.tareas || {
    "por-hacer": [],
    "en-progreso": [],
    "completado": [],
  };
  return p;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const payload =
    typeof err === "string"
      ? { error: err }
      : { error: err.message || "Internal Server Error" };
  res.status(status).json(payload);
}

function validateEstado(e) {
  return e === "por-hacer" || e === "en-progreso" || e === "completado";
}
function validatePrioridad(p) {
  return p === "alta" || p === "media" || p === "baja";
}

function normalizeProyectoInput(body) {
  const { nombre, descripcion = "", color = "#3B82F6", deadline = null, creadoPor = "" } = body || {};
  if (!nombre || typeof nombre !== "string") {
    const err = new Error("El nombre es requerido");
    err.status = 400;
    throw err;
  }
  return { nombre, descripcion, color, deadline, creadoPor };
}

// ------------------ Rutas Proyectos ------------------

// GET /api/proyectos?q=&page=&pageSize=
app.get("/api/proyectos", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  let items = Array.from(proyectos.values());
  if (q) items = items.filter((p) => p.nombre.toLowerCase().includes(q));
  // Paginación opcional simple
  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "50", 10);
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  res.json({
    page,
    pageSize,
    total: items.length,
    items: data,
  });
});

// GET /api/proyectos/:id
app.get("/api/proyectos/:id", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    res.json(p);
  } catch (e) {
    next(e);
  }
});

// POST /api/proyectos
app.post("/api/proyectos", (req, res, next) => {
  try {
    const input = normalizeProyectoInput(req.body);
    const id = Date.now().toString();
    const owner = (input.creadoPor || "").trim().toLowerCase();
    const nuevo = {
      id,
      nombre: input.nombre,
      descripcion: input.descripcion,
      color: input.color,
      deadline: input.deadline ?? null,
      creadoPor: owner,
      usuarios: owner ? [owner] : [],
      tareas: {
        "por-hacer": [],
        "en-progreso": [],
        "completado": [],
      },
    };
    proyectos.set(id, nuevo);
    res.status(201).json(nuevo);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/proyectos/:id
app.patch("/api/proyectos/:id", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    const patch = pick(req.body || {}, ["nombre", "descripcion", "color", "deadline"]);
    const actualizado = { ...p, ...patch };
    proyectos.set(p.id, actualizado);
    res.json(actualizado);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/proyectos/:id
app.delete("/api/proyectos/:id", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    proyectos.delete(p.id);
    chatsByProyecto.delete(p.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// POST /api/proyectos/:id/usuarios  { usuario: string }
app.post("/api/proyectos/:id/usuarios", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    const usuario = String(req.body?.usuario || "").trim().toLowerCase();
    if (!usuario) {
      const err = new Error("usuario es requerido");
      err.status = 400;
      throw err;
    }
    if (!p.usuarios.includes(usuario)) p.usuarios.push(usuario);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// DELETE /api/proyectos/:id/usuarios/:email
app.delete("/api/proyectos/:id/usuarios/:email", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    const email = String(req.params.email || "").trim().toLowerCase();
    p.usuarios = p.usuarios.filter((u) => u !== email);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ------------------ Rutas Tareas ------------------

// POST /api/proyectos/:id/tareas  { estado, titulo, descripcion?, prioridad?, deadline?, etiquetas? }
app.post("/api/proyectos/:id/tareas", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    const { estado, titulo, descripcion = "", prioridad = "media", deadline = null, etiquetas = [] } =
      req.body || {};
    if (!validateEstado(estado)) {
      const err = new Error("estado inválido");
      err.status = 400;
      throw err;
    }
    if (!titulo || typeof titulo !== "string") {
      const err = new Error("titulo es requerido");
      err.status = 400;
      throw err;
    }
    if (!validatePrioridad(prioridad)) {
      const err = new Error("prioridad inválida");
      err.status = 400;
      throw err;
    }
    const tarea = {
      id: uuid(),
      titulo,
      descripcion,
      prioridad,
      deadline: deadline ?? null,
      etiquetas: Array.isArray(etiquetas) ? etiquetas : [],
    };
    p.tareas[estado].push(tarea);
    proyectos.set(p.id, p);
    res.status(201).json(tarea);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/proyectos/:id/tareas/:tareaId
app.patch("/api/proyectos/:id/tareas/:tareaId", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    const tareaId = req.params.tareaId;
    const patch = pick(req.body || {}, [
      "titulo",
      "descripcion",
      "prioridad",
      "deadline",
      "etiquetas",
    ]);
    if (patch.prioridad && !validatePrioridad(patch.prioridad)) {
      const err = new Error("prioridad inválida");
      err.status = 400;
      throw err;
    }
    let updated = null;
    for (const col of Object.keys(p.tareas)) {
      const idx = p.tareas[col].findIndex((t) => t.id === tareaId);
      if (idx !== -1) {
        const t = p.tareas[col][idx];
        p.tareas[col][idx] = { ...t, ...patch };
        updated = p.tareas[col][idx];
        break;
      }
    }
    if (!updated) {
      const err = new Error("Tarea no encontrada");
      err.status = 404;
      throw err;
    }
    proyectos.set(p.id, p);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// POST /api/proyectos/:id/tareas/move { tareaId, destino }
app.post("/api/proyectos/:id/tareas/move", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    const { tareaId, destino } = req.body || {};
    if (!validateEstado(destino)) {
      const err = new Error("destino inválido");
      err.status = 400;
      throw err;
    }
    let moved = null;
    for (const col of Object.keys(p.tareas)) {
      const idx = p.tareas[col].findIndex((t) => t.id === tareaId);
      if (idx !== -1) {
        moved = p.tareas[col][idx];
        p.tareas[col].splice(idx, 1);
        break;
      }
    }
    if (!moved) {
      const err = new Error("Tarea no encontrada");
      err.status = 404;
      throw err;
    }
    p.tareas[destino].push(moved);
    proyectos.set(p.id, p);
    res.json(p);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/proyectos/:id/tareas/:tareaId
app.delete("/api/proyectos/:id/tareas/:tareaId", (req, res, next) => {
  try {
    const p = ensureProyecto(req.params.id);
    const tareaId = req.params.tareaId;
    let found = false;
    for (const col of Object.keys(p.tareas)) {
      const before = p.tareas[col].length;
      p.tareas[col] = p.tareas[col].filter((t) => t.id !== tareaId);
      if (p.tareas[col].length !== before) found = true;
    }
    if (!found) {
      const err = new Error("Tarea no encontrada");
      err.status = 404;
      throw err;
    }
    proyectos.set(p.id, p);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ------------------ Rutas Chat ------------------

// GET /api/proyectos/:id/chat?page=&pageSize=
app.get("/api/proyectos/:id/chat", (req, res) => {
  const id = req.params.id;
  const list = chatsByProyecto.get(id) || [];
  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "50", 10);
  if (!page && !pageSize) {
    return res.json(list);
  }
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  res.json({ page, pageSize, total: list.length, items });
});

// POST /api/proyectos/:id/chat  { sender, text }
app.post("/api/proyectos/:id/chat", (req, res, next) => {
  try {
    const id = req.params.id; // <- ya no exigimos ensureProyecto
    const sender = String(req.body?.sender || "").trim().toLowerCase();
    const text = String(req.body?.text || "").trim();

    if (!sender || !text) {
      const err = new Error("sender y text son requeridos");
      err.status = 400;
      throw err;
    }

    const msg = {
      id: uuid(),
      proyectoId: id,
      sender,
      text,
      ts: new Date().toISOString(),
    };

    const list = chatsByProyecto.get(id) || [];
    list.push(msg);
    chatsByProyecto.set(id, list);

    res.status(201).json(msg);
  } catch (e) {
    next(e);
  }
});


// Opcional: stub para demos
let TODOS = [{ id: 1, title: "Demo todo", done: false }];
app.get("/api/todos", (req, res) => res.json(TODOS));
app.post("/api/todos", (req, res) => {
  const title = String(req.body?.title || "").trim();
  const todo = { id: Date.now(), title, done: false };
  TODOS.push(todo);
  res.status(201).json(todo);
});


// (Opcional) Health para liveness checks (no lo usas en el front)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now(), env: process.env.NODE_ENV || "dev" });
});

// 404 genérico
app.use((req, res) => res.status(404).json({ error: "Not Found" }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API escuchando en :${PORT}`);
});
