/*
  Warnings:

  - The values [Owner] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('SystemAdmin', 'Admin', 'Client');
ALTER TABLE "public"."Client" ALTER COLUMN "roles" DROP DEFAULT;
ALTER TABLE "public"."Client" ALTER COLUMN "roles" TYPE "public"."UserRole_new"[] USING ("roles"::text::"public"."UserRole_new"[]);
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."Client" ALTER COLUMN "roles" SET DEFAULT ARRAY['Client']::"public"."UserRole"[];
COMMIT;

-- CreateTable
CREATE TABLE "public"."Habit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "frequencyPerWeek" JSONB NOT NULL,
    "frequencyPerDay" INTEGER,
    "current" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);
