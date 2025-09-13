const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS laxo (útil en dev + proxy de Vite)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// --- Datos en memoria ---
const todos = [];
let nextTodoId = 1;
const chats = new Map(); // Map<proyectoId, ChatMessage[]>

function getChatArray(pid) {
  if (!chats.has(pid)) chats.set(pid, []);
  return chats.get(pid);
}

// --- Rutas ---
app.get("/", (_req, res) => {
  res.type("text/plain").send("Task Manager API");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), env: NODE_ENV });
});

app.get("/api/todos", (_req, res) => {
  res.json(todos);
});

app.post("/api/todos", (req, res) => {
  const title = (req.body?.title || "").toString().trim();
  if (!title) return res.status(400).json({ error: "title requerido" });
  const todo = { id: nextTodoId++, title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

// Chat: devolvemos **array simple** (tu store suele esperar esto)
app.get("/api/proyectos/:id/chat", (req, res) => {
  const pid = req.params.id;
  res.json(getChatArray(pid));
});

app.post("/api/proyectos/:id/chat", (req, res) => {
  const pid = req.params.id;
  const sender = (req.body?.sender || "").toString().trim().toLowerCase();
  const text = (req.body?.text || "").toString().trim();
  if (!sender || !text) {
    return res.status(400).json({ error: "sender y text son requeridos" });
  }
  const msg = {
    id: randomUUID ? randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    proyectoId: pid,
    sender,
    text,
    ts: new Date().toISOString()
  };
  const arr = getChatArray(pid);
  arr.push(msg);
  res.status(201).json(msg);
});

// 404 JSON bajo /api/*
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT} (env: ${NODE_ENV})`);
});
