import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import proyectosRouter from "./routes/proyectos";
import { Prisma } from "@prisma/client";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rutas reales usadas por el frontend
app.use("/api/proyectos", proyectosRouter);

// Middleware de errores SIEMPRE JSON (y con más detalle de Prisma)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", err);

  // Errores “conocidos” de Prisma (p.ej., claves únicas, FK, tabla no existe, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      err.code === "P2002" ? 409 : // unique constraint
      err.code === "P2003" ? 400 : // FK fail
      err.code === "P2025" ? 404 : // record not found
      400;

    return res.status(status).json({
      error: err.code,
      message: err.message,
      meta: err.meta ?? undefined,
    });
  }

  // Otros errores que ya traen status
  if (typeof err?.status === "number") {
    return res.status(err.status).json({ error: err.message || "Error" });
  }

  // Fallback 500
  return res.status(500).json({ error: err?.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
