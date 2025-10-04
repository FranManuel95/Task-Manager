// backend/src/types/express-session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    email?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: { id: string; email: string };
    }
  }
}

export {};
