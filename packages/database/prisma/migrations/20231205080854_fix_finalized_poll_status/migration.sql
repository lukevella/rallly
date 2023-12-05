/*
  Fixes an issue in the previous migration where paused polls were not being
  set to finalized if they had an event_id.
*/
-- Set "status" to "finalized" if "event_id" is not null
UPDATE "polls"
SET "status" = 'finalized'::poll_status
WHERE "event_id" IS NOT NULL;
