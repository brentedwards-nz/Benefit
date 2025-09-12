/*
  Warnings:

  - You are about to drop the column `programmeTemplateId` on the `Programme` table. All the data in the column will be lost.
  - You are about to drop the column `programmeTemplateId` on the `ProgrammeEnrolment` table. All the data in the column will be lost.
  - You are about to drop the `ProgrammeTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Programme" DROP CONSTRAINT "Programme_programmeTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProgrammeEnrolment" DROP CONSTRAINT "ProgrammeEnrolment_programmeTemplateId_fkey";

-- AlterTable
ALTER TABLE "public"."Programme" DROP COLUMN "programmeTemplateId";

-- AlterTable
ALTER TABLE "public"."ProgrammeEnrolment" DROP COLUMN "programmeTemplateId";

-- DropTable
DROP TABLE "public"."ProgrammeTemplate";
