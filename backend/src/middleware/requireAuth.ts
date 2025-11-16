import type { Request, Response, NextFunction } from "express";

// Para poder colgar el usuario resuelto en req.authUser
export type AuthUser = { id: string; email: string };
declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export function requireAuthUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const s: any = req.session;

  // Acepta AMBOS formatos: { user: { id, email } } o bien userId/email sueltos
  const id = s?.user?.id ?? s?.userId;
  const email = s?.user?.email ?? s?.email;

  if (!id || !email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.authUser = { id, email };
  next();
}
