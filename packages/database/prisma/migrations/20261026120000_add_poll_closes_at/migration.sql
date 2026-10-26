-- AlterEnum
ALTER TYPE "poll_closed_reason" ADD VALUE 'deadline';

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "closes_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "polls_closes_at_idx" ON "polls"("closes_at");
