-- CreateEnum
CREATE TYPE "queued_email_kind" AS ENUM ('scheduled_event_invite');

-- CreateEnum
CREATE TYPE "queued_email_status" AS ENUM ('pending', 'sent', 'skipped', 'failed');

-- CreateTable
CREATE TABLE "queued_emails" (
    "id" TEXT NOT NULL,
    "kind" "queued_email_kind" NOT NULL,
    "subject_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "queued_email_status" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "claimed_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queued_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queued_emails_status_created_at_idx" ON "queued_emails"("status", "created_at");

-- CreateIndex
CREATE INDEX "queued_emails_batch_id_idx" ON "queued_emails"("batch_id");

-- CreateIndex
CREATE INDEX "queued_emails_user_id_status_idx" ON "queued_emails"("user_id", "status");

-- AddForeignKey
ALTER TABLE "queued_emails" ADD CONSTRAINT "queued_emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

