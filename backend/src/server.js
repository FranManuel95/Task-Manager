require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Orígenes permitidos (puedes sobreescribir con CORS_ORIGIN="http://localhost:5174,https://miapp.com")
const ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Permite herramientas CLI / curl (sin origin) y orígenes listados
    if (!origin) return cb(null, true);
    if (ORIGINS.includes("*") || ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`), false);
  },
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// --- Rutas demo (cámbialas por tus rutas reales) ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), env: process.env.NODE_ENV || "development" });
});

const todos = [{ id: 1, title: "Demo", done: false }];

app.get("/api/todos", (_req, res) => res.json(todos));

app.post("/api/todos", (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ message: "title is required" });
  const id = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1;
  const todo = { id, title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});
// -----------------------------------------------------

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
