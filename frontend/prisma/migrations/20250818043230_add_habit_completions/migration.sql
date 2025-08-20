-- CreateTable
CREATE TABLE "public"."HabitCompletion" (
    "id" TEXT NOT NULL,
    "programmeHabitId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "completionDate" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HabitCompletion_programmeHabitId_clientId_completionDate_key" ON "public"."HabitCompletion"("programmeHabitId", "clientId", "completionDate");

-- AddForeignKey
ALTER TABLE "public"."HabitCompletion" ADD CONSTRAINT "HabitCompletion_programmeHabitId_fkey" FOREIGN KEY ("programmeHabitId") REFERENCES "public"."ProgrammeHabit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HabitCompletion" ADD CONSTRAINT "HabitCompletion_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
