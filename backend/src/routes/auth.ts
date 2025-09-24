import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "../db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, avatarUrl, birthdate, jobTitle, phone } = req.body ?? {};
    const em = String(email ?? "").trim().toLowerCase();
    if (!em || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });

    const passwordHash = await bcrypt.hash(String(password), 10);

    await db.user.create({
      data: {
        email: em,
        passwordHash,
        name: name ? String(name) : null,
        avatarUrl: avatarUrl ? String(avatarUrl) : null,
        birthdate: birthdate ? new Date(String(birthdate)) : null,
        jobTitle: jobTitle ? String(jobTitle) : null,
        phone: phone ? String(phone) : null,
      },
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    // P2002 = unique constraint (email ya existe)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "Email ya registrado" });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};
    const em = String(email ?? "").trim().toLowerCase();
    if (!em || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });

    const user = await db.user.findUnique({ where: { email: em } });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    // Devuelve lo que tu frontend espera guardar
    return res.json({
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
