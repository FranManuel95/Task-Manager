// backend/src/routes/auth.ts
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import bcrypt from "bcryptjs";

const router = Router();

// POST /api/auth/register
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, avatarUrl, birthdate, jobTitle, phone } =
        req.body ?? {};
      const em = String(email ?? "")
        .trim()
        .toLowerCase();
      const pw = String(password ?? "");

      if (!em || !pw)
        return res.status(400).json({ error: "Email y contraseña requeridos" });

      const exists = await db.user.findUnique({
        where: { email: em },
        select: { id: true },
      });
      if (exists) return res.status(409).json({ error: "Ese email ya existe" });

      const hash = await bcrypt.hash(pw, 10);

      await db.user.create({
        data: {
          email: em,
          passwordHash: hash,
          name: name ? String(name) : undefined,
          avatarUrl: avatarUrl ? String(avatarUrl) : undefined,
          birthdate: birthdate ? new Date(birthdate) : undefined,
          jobTitle: jobTitle ? String(jobTitle) : undefined,
          phone: phone ? String(phone) : undefined,
        },
      });

      return res.status(201).json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

// POST /api/auth/login
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body ?? {};
      const em = String(email ?? "")
        .trim()
        .toLowerCase();
      const pw = String(password ?? "");

      if (!em || !pw)
        return res.status(400).json({ error: "Email y contraseña requeridos" });

      const user = await db.user.findUnique({
        where: { email: em },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          avatarUrl: true,
        },
      });
      if (!user)
        return res.status(401).json({ error: "Credenciales inválidas" });

      const ok = await bcrypt.compare(pw, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

      // 🔐 Regenera sesión y guarda los datos antes de responder
      req.session.regenerate((err) => {
        if (err) return next(err);

        // Guardamos en ambos formatos por compatibilidad
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.user = {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          avatarUrl: user.avatarUrl ?? null,
        };

        req.session.save((err2) => {
          if (err2) return next(err2);

          return res.json({
            email: user.email,
            name: user.name ?? null,
            avatarUrl: user.avatarUrl ?? null,
          });
        });
      });
    } catch (e) {
      next(e);
    }
  },
);

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  res.json(user);
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  // destruye la sesión y limpia la cookie
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    return res.status(204).end();
  });
});

export default router;
