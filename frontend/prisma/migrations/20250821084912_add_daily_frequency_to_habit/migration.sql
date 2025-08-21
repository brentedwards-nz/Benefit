/*
  Warnings:

  - You are about to drop the column `frequencyPerDay` on the `Habit` table. All the data in the column will be lost.
  - You are about to drop the column `frequencyPerWeek` on the `Habit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Habit" DROP COLUMN "frequencyPerDay",
DROP COLUMN "frequencyPerWeek",
ADD COLUMN     "friFrequency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monFrequency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "satFrequency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sunFrequency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thuFrequency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tueFrequency" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wedFrequency" INTEGER NOT NULL DEFAULT 0;
