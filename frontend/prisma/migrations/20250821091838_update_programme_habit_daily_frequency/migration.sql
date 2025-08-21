/*
  Warnings:

  - Made the column `friFrequency` on table `ProgrammeHabit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `monFrequency` on table `ProgrammeHabit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `satFrequency` on table `ProgrammeHabit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sunFrequency` on table `ProgrammeHabit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `thuFrequency` on table `ProgrammeHabit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tueFrequency` on table `ProgrammeHabit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `wedFrequency` on table `ProgrammeHabit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ProgrammeHabit" ALTER COLUMN "friFrequency" SET NOT NULL,
ALTER COLUMN "friFrequency" SET DEFAULT 0,
ALTER COLUMN "monFrequency" SET NOT NULL,
ALTER COLUMN "monFrequency" SET DEFAULT 0,
ALTER COLUMN "satFrequency" SET NOT NULL,
ALTER COLUMN "satFrequency" SET DEFAULT 0,
ALTER COLUMN "sunFrequency" SET NOT NULL,
ALTER COLUMN "sunFrequency" SET DEFAULT 0,
ALTER COLUMN "thuFrequency" SET NOT NULL,
ALTER COLUMN "thuFrequency" SET DEFAULT 0,
ALTER COLUMN "tueFrequency" SET NOT NULL,
ALTER COLUMN "tueFrequency" SET DEFAULT 0,
ALTER COLUMN "wedFrequency" SET NOT NULL,
ALTER COLUMN "wedFrequency" SET DEFAULT 0;
