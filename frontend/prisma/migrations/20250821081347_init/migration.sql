/*
  Warnings:

  - You are about to drop the column `frequencyPerDay` on the `ProgrammeHabit` table. All the data in the column will be lost.
  - You are about to drop the column `frequencyPerWeek` on the `ProgrammeHabit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ProgrammeHabit" DROP COLUMN "frequencyPerDay",
DROP COLUMN "frequencyPerWeek",
ADD COLUMN     "friFrequency" INTEGER DEFAULT 1,
ADD COLUMN     "monFrequency" INTEGER DEFAULT 1,
ADD COLUMN     "satFrequency" INTEGER DEFAULT 1,
ADD COLUMN     "sunFrequency" INTEGER DEFAULT 1,
ADD COLUMN     "thuFrequency" INTEGER DEFAULT 1,
ADD COLUMN     "tueFrequency" INTEGER DEFAULT 1,
ADD COLUMN     "wedFrequency" INTEGER DEFAULT 1;
