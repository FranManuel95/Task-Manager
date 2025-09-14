// backend/src/db.ts
import { PrismaClient, type Prisma } from "@prisma/client";

export const prisma = new PrismaClient({
  // Evita el error de tipos: usa los literales de LogLevel
  log: ["query", "warn", "error"] as Prisma.LogLevel[],
});

// Útil para healthchecks si lo necesitas
export async function ensureUp() {
  await prisma.$queryRaw`SELECT 1`;
}
