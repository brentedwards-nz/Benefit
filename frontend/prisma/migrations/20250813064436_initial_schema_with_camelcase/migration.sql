-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SystemAdmin', 'Owner', 'Admin', 'Client');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

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
    "createdAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6),
    "roles" "public"."UserRole"[] DEFAULT ARRAY['Client']::"public"."UserRole"[],
    "authId" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Programme" (
    "id" TEXT NOT NULL,
    "programmeTemplateId" TEXT NOT NULL,
    "humanReadableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maxClients" INTEGER NOT NULL,
    "numberOfSessions" INTEGER NOT NULL,
    "programmeCost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "adhocData" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgrammeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maxClients" INTEGER NOT NULL,
    "numberOfSessions" INTEGER NOT NULL,
    "programmeCost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "adhocData" JSONB,

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
    "programmeTemplateId" TEXT,

    CONSTRAINT "ProgrammeEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemGmailConfig" (
    "id" BIGSERIAL NOT NULL,
    "connectedEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encryptedRefreshToken" TEXT,

    CONSTRAINT "system_gmail_config_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "system_gmail_config_connected_email_key" ON "public"."SystemGmailConfig"("connectedEmail");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Programme" ADD CONSTRAINT "Programme_programmeTemplateId_fkey" FOREIGN KEY ("programmeTemplateId") REFERENCES "public"."ProgrammeTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_programmeTemplateId_fkey" FOREIGN KEY ("programmeTemplateId") REFERENCES "public"."ProgrammeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
