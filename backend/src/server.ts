// backend/src/server.ts
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import session from "express-session";
import proyectosRouter from "./routes/proyectos";
import authRouter from "./routes/auth";
import { Prisma } from "@prisma/client";

const app = express();

// CORS primero (permite credenciales)
app.use(
  cors({
    origin: true, // refleja el Origin
    credentials: true, // permite cookies
  }),
);

// Body parser
app.use(express.json());

// (Opcional pero recomendable si hay proxy como Vite/NGINX)
app.set("trust proxy", 1);

// *** MUY IMPORTANTE: sesión ANTES de los routers ***
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax", // funciona con el proxy de Vite (localhost:5174)
      // secure: true        // solo si sirves por HTTPS y has puesto trust proxy
    },
  }),
);

// Rutas reales usadas por el frontend (después de session)
app.use("/api/auth", authRouter);
app.use("/api/proyectos", proyectosRouter);

// Middleware de errores SIEMPRE JSON (y con más detalle de Prisma)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      err.code === "P2002"
        ? 409
        : err.code === "P2003"
          ? 400
          : err.code === "P2025"
            ? 404
            : 400;

    return res.status(status).json({
      error: err.code,
      message: err.message,
      meta: err.meta ?? undefined,
    });
  }

  if (typeof err?.status === "number") {
    return res.status(err.status).json({ error: err.message || "Error" });
  }

  return res
    .status(500)
    .json({ error: err?.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
