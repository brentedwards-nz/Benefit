/*
  Warnings:

  - You are about to drop the column `numberOfWeeks` on the `ProgrammeEnrolment` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `ProgrammeEnrolment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ProgrammeEnrolment" DROP COLUMN "numberOfWeeks",
DROP COLUMN "startDate";
