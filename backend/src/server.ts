// backend/src/server.ts
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import proyectosRouter from "./routes/proyectos";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/proyectos", proyectosRouter);

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (err?.code === "P2025") return res.status(404).json({ error: "No encontrado" });
  return res.status(500).json({ error: err?.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
