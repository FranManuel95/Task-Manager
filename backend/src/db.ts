// backend/src/db.ts
import { PrismaClient, type Prisma } from "@prisma/client";

export const db = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? (["query", "warn", "error"] as const) : (["error"] as const),
});

export type { Prisma };
