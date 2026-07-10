-- CreateEnum
CREATE TYPE "poll_closed_reason" AS ENUM ('auto', 'manual');

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "closed_reason" "poll_closed_reason";

-- Backfill: a closed poll whose options have all ended (the auto-close-polls
-- condition: end = start + duration, all-day options counted as 24h) is
-- attributed to auto-close; a closed poll with a future option can only have
-- been closed by the organizer, since the cron never closes those.
UPDATE polls p
SET closed_reason = CASE
  WHEN EXISTS (
    SELECT 1 FROM options o
    WHERE o.poll_id = p.id
      AND o.start_time + (CASE WHEN o.duration_minutes = 0
            THEN interval '24 hours'
            ELSE make_interval(mins => o.duration_minutes) END) > (now() AT TIME ZONE 'UTC')
  ) THEN 'manual'::poll_closed_reason
  ELSE 'auto'::poll_closed_reason
END
WHERE p.status = 'closed';
