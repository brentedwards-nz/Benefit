-- AlterTable
ALTER TABLE "public"."ClientTransaction" ADD COLUMN     "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0.0125,
ADD COLUMN     "total" DECIMAL(65,30) NOT NULL DEFAULT 0;
