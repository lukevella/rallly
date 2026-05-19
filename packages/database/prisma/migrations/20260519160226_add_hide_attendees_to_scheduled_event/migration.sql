-- AlterTable
ALTER TABLE "scheduled_events" ADD COLUMN     "hide_attendees" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: inherit hideAttendees from the source poll's hideParticipants
-- (events created from a poll that had hideParticipants = true)
UPDATE "scheduled_events" se
SET "hide_attendees" = true
WHERE EXISTS (
  SELECT 1
  FROM "polls" p
  WHERE p."scheduled_event_id" = se."id"
    AND p."hide_participants" = true
);
