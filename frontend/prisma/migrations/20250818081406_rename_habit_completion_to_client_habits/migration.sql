/*
  Warnings:

  - You are about to drop the `HabitCompletion` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `numberOfWeeks` to the `ProgrammeEnrolment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `ProgrammeEnrolment` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the new columns with default values
ALTER TABLE "public"."ProgrammeEnrolment" ADD COLUMN "numberOfWeeks" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "public"."ProgrammeEnrolment" ADD COLUMN "startDate" DATE NOT NULL DEFAULT CURRENT_DATE;

-- Remove the default constraints
ALTER TABLE "public"."ProgrammeEnrolment" ALTER COLUMN "numberOfWeeks" DROP DEFAULT;
ALTER TABLE "public"."ProgrammeEnrolment" ALTER COLUMN "startDate" DROP DEFAULT;

-- Create the new ClientHabits table
CREATE TABLE "public"."ClientHabits" (
    "id" TEXT NOT NULL,
    "programmeHabitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "completionDate" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientHabits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientHabits_programmeHabitId_clientId_completionDate_key" ON "public"."ClientHabits"("programmeHabitId", "clientId", "completionDate");

-- AddForeignKey
ALTER TABLE "public"."ClientHabits" ADD CONSTRAINT "ClientHabits_programmeHabitId_fkey" FOREIGN KEY ("programmeHabitId") REFERENCES "public"."ProgrammeHabit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ClientHabits" ADD CONSTRAINT "ClientHabits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy data from HabitCompletion to ClientHabits
INSERT INTO "public"."ClientHabits" ("id", "programmeHabitId", "clientId", "completionDate", "completed", "notes", "createdAt", "updatedAt")
SELECT "id", "programmeHabitId", "clientId", "completionDate", "completed", "notes", "createdAt", "updatedAt"
FROM "public"."HabitCompletion";

-- DropForeignKey
ALTER TABLE "public"."HabitCompletion" DROP CONSTRAINT "HabitCompletion_clientId_fkey";
ALTER TABLE "public"."HabitCompletion" DROP CONSTRAINT "HabitCompletion_programmeHabitId_fkey";

-- DropTable
DROP TABLE "public"."HabitCompletion";
