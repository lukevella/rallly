-- CreateEnum
CREATE TYPE "scheduled_event_invite_email_status" AS ENUM ('pending', 'sent', 'skipped', 'failed');

-- AlterTable
ALTER TABLE "scheduled_event_invites" ADD COLUMN     "email_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email_claimed_at" TIMESTAMP(3),
ADD COLUMN     "email_sent_at" TIMESTAMP(3),
ADD COLUMN     "email_status" "scheduled_event_invite_email_status";

-- CreateIndex
CREATE INDEX "scheduled_event_invites_email_status_scheduled_event_id_idx" ON "scheduled_event_invites"("email_status", "scheduled_event_id");

