-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('Male', 'Female', 'Other', 'PreferNotToSay');

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "gender" "public"."Gender";
