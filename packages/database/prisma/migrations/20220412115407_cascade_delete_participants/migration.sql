-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_pollId_fkey";

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("urlId") ON DELETE CASCADE ON UPDATE CASCADE;
