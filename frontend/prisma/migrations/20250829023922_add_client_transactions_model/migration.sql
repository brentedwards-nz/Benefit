-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('Pending', 'Complete');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('Invoice', 'Payment', 'CreditNote', 'Adjustment');

-- CreateTable
CREATE TABLE "public"."ClientTransaction" (
    "id" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "debitAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'Pending',
    "transactionType" "public"."TransactionType" NOT NULL,
    "clientId" TEXT NOT NULL,
    "programmeEnrolmentId" TEXT,

    CONSTRAINT "ClientTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ClientTransaction" ADD CONSTRAINT "ClientTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientTransaction" ADD CONSTRAINT "ClientTransaction_programmeEnrolmentId_fkey" FOREIGN KEY ("programmeEnrolmentId") REFERENCES "public"."ProgrammeEnrolment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
