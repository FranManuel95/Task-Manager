-- CreateEnum
CREATE TYPE "public"."Estado" AS ENUM ('por-hacer', 'en-progreso', 'completado');

-- CreateEnum
CREATE TYPE "public"."Prioridad" AS ENUM ('alta', 'media', 'baja');

-- CreateTable
CREATE TABLE "public"."proyectos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "deadline" TIMESTAMP(3),
    "creadoPor" TEXT NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proyecto_usuarios" (
    "proyectoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "proyecto_usuarios_pkey" PRIMARY KEY ("proyectoId","email")
);

-- CreateTable
CREATE TABLE "public"."tareas" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "prioridad" "public"."Prioridad" NOT NULL DEFAULT 'media',
    "deadline" TIMESTAMP(3),
    "etiquetas" TEXT[],
    "estado" "public"."Estado" NOT NULL DEFAULT 'por-hacer',

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."proyecto_usuarios" ADD CONSTRAINT "proyecto_usuarios_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tareas" ADD CONSTRAINT "tareas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
