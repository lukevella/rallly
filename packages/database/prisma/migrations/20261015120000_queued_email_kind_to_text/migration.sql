-- AlterTable
ALTER TABLE "queued_emails" ALTER COLUMN "kind" SET DATA TYPE TEXT USING "kind"::text;

-- DropEnum
DROP TYPE "queued_email_kind";
