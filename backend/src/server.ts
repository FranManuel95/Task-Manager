import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import proyectosRouter from "./routes/proyectos";
import authRouter from "./routes/auth"; // 👈 AÑADIDO
import { Prisma } from "@prisma/client";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rutas
app.use("/api/auth", authRouter);       // 👈 AÑADIDO
app.use("/api/proyectos", proyectosRouter);

// Middleware de errores SIEMPRE JSON
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      err.code === "P2002" ? 409 :
      err.code === "P2003" ? 400 :
      err.code === "P2025" ? 404 :
      400;

    return res.status(status).json({
      error: err.code,
      message: err.message,
      meta: err.meta ?? undefined,
    });
  }

  if (typeof err?.status === "number") {
    return res.status(err.status).json({ error: err.message || "Error" });
  }

  return res.status(500).json({ error: err?.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
