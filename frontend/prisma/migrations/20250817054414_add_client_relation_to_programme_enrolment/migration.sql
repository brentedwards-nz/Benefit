-- AddForeignKey
ALTER TABLE "public"."ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
