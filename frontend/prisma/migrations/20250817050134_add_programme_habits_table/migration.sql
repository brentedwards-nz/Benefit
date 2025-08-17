-- CreateTable
CREATE TABLE "public"."ProgrammeHabit" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "frequencyPerWeek" JSONB NOT NULL,
    "frequencyPerDay" INTEGER,
    "current" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgrammeHabit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeHabit_programmeId_habitId_key" ON "public"."ProgrammeHabit"("programmeId", "habitId");

-- AddForeignKey
ALTER TABLE "public"."ProgrammeHabit" ADD CONSTRAINT "ProgrammeHabit_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "public"."Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgrammeHabit" ADD CONSTRAINT "ProgrammeHabit_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "public"."Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
