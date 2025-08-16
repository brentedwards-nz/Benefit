/*
  Warnings:

  - You are about to drop the column `numberOfSessions` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfSessions` on the `ProgrammeTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Programme" DROP COLUMN "numberOfSessions",
ADD COLUMN     "sessionsDescription" JSONB;

-- AlterTable
ALTER TABLE "public"."ProgrammeTemplate" DROP COLUMN "numberOfSessions",
ADD COLUMN     "sessionsDescription" JSONB;
