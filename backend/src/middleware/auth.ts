import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type JwtPayload = {
  sub: string;     // userId
  email: string;   // user email
  iat?: number;
  exp?: number;
};

export function signAuthToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token =
      (req.cookies && req.cookies[COOKIE_NAME]) ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice("Bearer ".length)
        : null);

    if (!token) return res.status(401).json({ error: "No autenticado" });

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).userId = decoded.sub;
    (req as any).userEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}
