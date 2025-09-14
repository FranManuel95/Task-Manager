/*
  Warnings:

  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proyecto_usuarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proyectos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tareas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."chats" DROP CONSTRAINT "chats_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."proyecto_usuarios" DROP CONSTRAINT "proyecto_usuarios_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tareas" DROP CONSTRAINT "tareas_proyectoId_fkey";

-- DropTable
DROP TABLE "public"."chats";

-- DropTable
DROP TABLE "public"."proyecto_usuarios";

-- DropTable
DROP TABLE "public"."proyectos";

-- DropTable
DROP TABLE "public"."tareas";

-- CreateTable
CREATE TABLE "public"."Proyecto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "deadline" TIMESTAMP(3),
    "creadoPor" TEXT NOT NULL,
    "usuarios" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tarea" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" "public"."Prioridad" NOT NULL DEFAULT 'media',
    "deadline" TIMESTAMP(3),
    "etiquetas" TEXT[],
    "estado" "public"."Estado" NOT NULL DEFAULT 'por-hacer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_proyectoId_ts_idx" ON "public"."ChatMessage"("proyectoId", "ts");

-- AddForeignKey
ALTER TABLE "public"."Tarea" ADD CONSTRAINT "Tarea_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
