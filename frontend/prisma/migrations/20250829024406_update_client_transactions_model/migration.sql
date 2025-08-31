/*
  Warnings:

  - You are about to drop the column `creditAmount` on the `ClientTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `debitAmount` on the `ClientTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ClientTransaction" DROP COLUMN "creditAmount",
DROP COLUMN "debitAmount",
ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
