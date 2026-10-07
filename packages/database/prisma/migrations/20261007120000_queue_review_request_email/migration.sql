-- AlterEnum
ALTER TYPE "queued_email_kind" ADD VALUE 'review_request';

-- AlterTable
ALTER TABLE "queued_emails" ADD COLUMN "send_after" TIMESTAMP(3);
