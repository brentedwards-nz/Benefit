-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SystemAdmin', 'Owner', 'Admin', 'Coordinator', 'Instructor', 'ProfileOnly');

-- CreateTable
CREATE TABLE "public"."club" (
    "club_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "club_name" TEXT NOT NULL,
    "club_address" TEXT,
    "club_phone" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_pkey" PRIMARY KEY ("club_id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "auth_id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "birth_date" DATE,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "contact_info" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("auth_id")
);

-- CreateTable
CREATE TABLE "public"."staff" (
    "staff_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "club_id" UUID NOT NULL,
    "auth_id" UUID NOT NULL,
    "hired_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT true,
    "roles" JSONB DEFAULT '[{"role": "Profile Only"}]',

    CONSTRAINT "staff_pkey" PRIMARY KEY ("staff_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_club_id_profile_id_key" ON "public"."staff"("club_id", "auth_id");

-- AddForeignKey
ALTER TABLE "public"."staff" ADD CONSTRAINT "staff_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."club"("club_id") ON DELETE CASCADE ON UPDATE NO ACTION;
