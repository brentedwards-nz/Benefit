-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('Pending', 'Complete');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('Invoice', 'Payment', 'CreditNote', 'Adjustment');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SystemAdmin', 'Admin', 'Client', 'Trainer');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('Male', 'Female', 'Other', 'PreferNotToSay');

-- CreateEnum
CREATE TYPE "public"."SystemSettingType" AS ENUM ('String', 'Number', 'Boolean', 'Json', 'DateTime', 'Enum', 'Array', 'Object');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "id_token" TEXT,
    "refresh_token" TEXT,
    "session_state" TEXT,
    "token_type" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "birthDate" DATE,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "contactInfo" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),
    "roles" "public"."UserRole"[] DEFAULT ARRAY['Client']::"public"."UserRole"[],
    "authId" TEXT NOT NULL,
    "gender" "public"."Gender",

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Programme" (
    "id" TEXT NOT NULL,
    "programmeTemplateId" TEXT,
    "humanReadableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxClients" INTEGER NOT NULL,
    "programmeCost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "adhocData" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "sessionsDescription" JSONB,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgrammeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxClients" INTEGER NOT NULL,
    "programmeCost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "adhocData" JSONB,
    "sessionsDescription" JSONB,

    CONSTRAINT "ProgrammeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgrammeEnrolment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "notes" TEXT,
    "adhocData" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "programmeTemplateId" TEXT NOT NULL,

    CONSTRAINT "ProgrammeEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OAuthServices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthServices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Habit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "monFrequency" INTEGER NOT NULL DEFAULT 0,
    "tueFrequency" INTEGER NOT NULL DEFAULT 0,
    "wedFrequency" INTEGER NOT NULL DEFAULT 0,
    "thuFrequency" INTEGER NOT NULL DEFAULT 0,
    "friFrequency" INTEGER NOT NULL DEFAULT 0,
    "satFrequency" INTEGER NOT NULL DEFAULT 0,
    "sunFrequency" INTEGER NOT NULL DEFAULT 0,
    "current" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgrammeHabit" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "notes" TEXT,
    "monFrequency" INTEGER NOT NULL DEFAULT 0,
    "tueFrequency" INTEGER NOT NULL DEFAULT 0,
    "wedFrequency" INTEGER NOT NULL DEFAULT 0,
    "thuFrequency" INTEGER NOT NULL DEFAULT 0,
    "friFrequency" INTEGER NOT NULL DEFAULT 0,
    "satFrequency" INTEGER NOT NULL DEFAULT 0,
    "sunFrequency" INTEGER NOT NULL DEFAULT 0,
    "current" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgrammeHabit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientHabit" (
    "id" TEXT NOT NULL,
    "programmeHabitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "habitDate" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "timesDone" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientHabit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientTransaction" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "programmeEnrolmentId" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0.125,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'Pending',
    "transactionType" "public"."TransactionType" NOT NULL,

    CONSTRAINT "ClientTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "public"."SystemSettingType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "client_auth_id_unique" ON "public"."Client"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_humanReadableId_key" ON "public"."Programme"("humanReadableId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeTemplate_name_key" ON "public"."ProgrammeTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeHabit_programmeId_habitId_key" ON "public"."ProgrammeHabit"("programmeId", "habitId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientHabit_programmeHabitId_clientId_habitDate_key" ON "public"."ClientHabit"("programmeHabitId", "clientId", "habitDate");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "public"."SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Programme" ADD CONSTRAINT "Programme_programmeTemplateId_fkey" FOREIGN KEY ("programmeTemplateId") REFERENCES "public"."ProgrammeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_programmeTemplateId_fkey" FOREIGN KEY ("programmeTemplateId") REFERENCES "public"."ProgrammeTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeHabit" ADD CONSTRAINT "ProgrammeHabit_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "public"."Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeHabit" ADD CONSTRAINT "ProgrammeHabit_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "public"."Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientHabit" ADD CONSTRAINT "ClientHabit_programmeHabitId_fkey" FOREIGN KEY ("programmeHabitId") REFERENCES "public"."ProgrammeHabit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientHabit" ADD CONSTRAINT "ClientHabit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientTransaction" ADD CONSTRAINT "ClientTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientTransaction" ADD CONSTRAINT "ClientTransaction_programmeEnrolmentId_fkey" FOREIGN KEY ("programmeEnrolmentId") REFERENCES "public"."ProgrammeEnrolment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
