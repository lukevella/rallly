-- AlterEnum: Migrate poll_status from (live, paused, finalized) to (open, closed, scheduled, canceled)
BEGIN;

-- Create the new enum type
CREATE TYPE "poll_status_new" AS ENUM ('open', 'closed', 'scheduled', 'canceled');

-- Drop the default before altering
ALTER TABLE "polls" ALTER COLUMN "status" DROP DEFAULT;

-- Convert old values to new values during the type change
ALTER TABLE "polls" ALTER COLUMN "status" TYPE "poll_status_new" USING (
  CASE "status"::text
    WHEN 'live' THEN 'open'::poll_status_new
    WHEN 'paused' THEN 'closed'::poll_status_new
    WHEN 'finalized' THEN 'scheduled'::poll_status_new
    ELSE 'open'::poll_status_new
  END
);

-- Swap the enum types
ALTER TYPE "poll_status" RENAME TO "poll_status_old";
ALTER TYPE "poll_status_new" RENAME TO "poll_status";
DROP TYPE "poll_status_old";

-- Restore the default with new value
ALTER TABLE "polls" ALTER COLUMN "status" SET DEFAULT 'open';

COMMIT;
