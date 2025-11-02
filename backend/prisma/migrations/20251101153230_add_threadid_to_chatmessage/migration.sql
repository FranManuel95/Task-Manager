/*
  Arreglos clave:
  - Copiamos datos de "ts" a "createdAt" antes de eliminar "ts".
  - Rellenamos "updatedAt" y luego aplicamos NOT NULL.
  - FK de ChatMessage.threadId con ON DELETE SET NULL.
  - Índices actualizados a createdAt.
*/

-- CreateEnum (si no existía ya en otra migración)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompanyType') THEN
    CREATE TYPE "CompanyType" AS ENUM ('client', 'supplier', 'carrier');
  END IF;
END $$;

-- =========================================================
-- ChatMessage: añadir columnas nuevas primero y backfill
-- =========================================================

-- 1) AÑADIR createdAt como NULLable temporalmente
ALTER TABLE "ChatMessage"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

-- 2) COPIAR datos desde "ts" si existe, o poner NOW() si está NULL
DO $$
BEGIN
  -- Si la columna ts existe en la tabla, copiamos su valor
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ChatMessage' AND column_name = 'ts'
  ) THEN
    UPDATE "ChatMessage"
      SET "createdAt" = COALESCE("createdAt", "ts")
      WHERE "createdAt" IS NULL;
  END IF;

  -- Para cualquier fila que aún siga sin createdAt, usar current timestamp
  UPDATE "ChatMessage"
    SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
    WHERE "createdAt" IS NULL;
END $$;

-- 3) Poner DEFAULT y NOT NULL a createdAt
ALTER TABLE "ChatMessage"
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ChatMessage"
  ALTER COLUMN "createdAt" SET NOT NULL;

-- 4) AÑADIR threadId si no existiese
ALTER TABLE "ChatMessage"
  ADD COLUMN IF NOT EXISTS "threadId" TEXT;

-- 5) AÑADIR updatedAt como NULLable temporalmente
ALTER TABLE "ChatMessage"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- 6) BACKFILL de updatedAt a NOW() donde esté NULL
UPDATE "ChatMessage"
  SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
  WHERE "updatedAt" IS NULL;

-- 7) Poner DEFAULT y NOT NULL a updatedAt
ALTER TABLE "ChatMessage"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ChatMessage"
  ALTER COLUMN "updatedAt" SET NOT NULL;

-- 8) ELIMINAR índices viejos que dependían de ts (si existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE c.relname = 'ChatMessage_proyectoId_ts_idx' AND n.nspname='public') THEN
    DROP INDEX "public"."ChatMessage_proyectoId_ts_idx";
  END IF;
END $$;

-- 9) ELIMINAR la columna ts una vez migrados los datos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ChatMessage' AND column_name = 'ts'
  ) THEN
    ALTER TABLE "ChatMessage" DROP COLUMN "ts";
  END IF;
END $$;

-- 10) CREAR nuevos índices útiles
CREATE INDEX IF NOT EXISTS "ChatMessage_proyectoId_createdAt_idx"
  ON "ChatMessage"("proyectoId", "createdAt");

CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_createdAt_idx"
  ON "ChatMessage"("threadId", "createdAt");

-- =========================================================
-- Proyecto: quitar default de color si lo hubiera
-- =========================================================
ALTER TABLE "Proyecto" ALTER COLUMN "color" DROP DEFAULT;

-- =========================================================
-- ChatThread: crear tabla (idempotente dentro de la migración)
-- =========================================================
CREATE TABLE IF NOT EXISTS "ChatThread" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "participants" TEXT[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- FK de ChatThread -> Proyecto (CASCADE al borrar proyecto)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ChatThread_proyectoId_fkey'
      AND table_name = 'ChatThread'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "ChatThread"
      ADD CONSTRAINT "ChatThread_proyectoId_fkey"
      FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Índice útil
CREATE INDEX IF NOT EXISTS "ChatThread_proyectoId_idx"
  ON "ChatThread"("proyectoId");

-- =========================================================
-- FK de ChatMessage.threadId -> ChatThread (SET NULL al borrar hilo)
-- =========================================================
DO $$
BEGIN
  -- Borrar FK previa si existía con otra política
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ChatMessage_threadId_fkey'
      AND table_name = 'ChatMessage'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_threadId_fkey";
  END IF;

  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
END $$;

-- =========================================================
-- Auditoría: índice (opcional) - recrearlo si lo eliminaste antes
-- =========================================================

-- El archivo original eliminaba este índice. Lo recreamos sobre (proyectoId, createdAt desc):
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE c.relname = 'AuditLog_proyectoId_createdAt_idx' AND n.nspname='public') THEN
    DROP INDEX "public"."AuditLog_proyectoId_createdAt_idx";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AuditLog_proyectoId_createdAt_idx"
  ON "AuditLog"("proyectoId", "createdAt" DESC);
