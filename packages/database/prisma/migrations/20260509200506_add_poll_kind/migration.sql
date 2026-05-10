-- CreateEnum
CREATE TYPE "poll_kind" AS ENUM ('date', 'time');

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "kind" "poll_kind" NOT NULL DEFAULT 'date';

-- Backfill: polls with any option duration > 0 are time-based
UPDATE "polls"
SET "kind" = 'time'
WHERE "id" IN (
  SELECT DISTINCT "poll_id" FROM "options" WHERE "duration_minutes" > 0
);
