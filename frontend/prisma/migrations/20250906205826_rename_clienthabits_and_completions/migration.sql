/*
  Warnings:

  - You are about to drop the `ClientHabits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientHabits" DROP CONSTRAINT "ClientHabits_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientHabits" DROP CONSTRAINT "ClientHabits_programmeHabitId_fkey";

-- DropTable
DROP TABLE "public"."ClientHabits";

-- CreateTable
CREATE TABLE "public"."ClientHabit" (
    "id" TEXT NOT NULL,
    "programmeHabitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "habitDate" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "timesDone" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientHabit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientHabit_programmeHabitId_clientId_habitDate_key" ON "public"."ClientHabit"("programmeHabitId", "clientId", "habitDate");

-- AddForeignKey
ALTER TABLE "public"."ClientHabit" ADD CONSTRAINT "ClientHabit_programmeHabitId_fkey" FOREIGN KEY ("programmeHabitId") REFERENCES "public"."ProgrammeHabit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientHabit" ADD CONSTRAINT "ClientHabit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
