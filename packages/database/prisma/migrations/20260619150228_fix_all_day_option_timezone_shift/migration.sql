-- Fix all-day (date-only) polls so they are timezone-invariant. The intended
-- model is: a date-only poll carries NO timezone, so a falsy poll.time_zone is
-- the single source of truth for "this is a floating date". Two things went
-- wrong historically and both are repaired here:
--
--   1. Date-only polls ended up with a timezone, which made the UI convert
--      their dates to each viewer's zone (a date picked as "Jul 1" rendered as
--      "Jun 30" for an earlier-timezone viewer).
--   2. Their option timestamps were stored with the creator's offset baked in
--      (e.g. "Jul 1" in UTC+1 stored as 2026-06-30 23:00Z) instead of UTC
--      midnight.
--
-- We must fix the timestamps BEFORE clearing the timezone: the offset is baked
-- into start_time, so simply nulling the timezone would leave the stored value
-- a day off (and regress the creator's own view). Recovery reinterprets the
-- stored instant in the poll timezone to get the creator's intended local date,
-- then snaps it to UTC midnight.
--
-- Guards: `::time <> '00:00:00'` targets only offset-baked rows and leaves
-- already-correct (UTC-midnight) rows alone, keeping this idempotent. The
-- pg_timezone_names check skips rows with a non-IANA timezone string so the
-- migration cannot fail on bad data.
--
-- Preview (run before applying to size the blast radius):
--   SELECT COUNT(*) FROM options o JOIN polls p ON p.id = o.poll_id
--   WHERE o.duration_minutes = 0 AND p.time_zone IS NOT NULL
--     AND o.start_time::time <> '00:00:00';
--   SELECT COUNT(*) FROM polls p
--   WHERE p.time_zone IS NOT NULL
--     AND EXISTS (SELECT 1 FROM options o WHERE o.poll_id = p.id AND o.duration_minutes = 0)
--     AND NOT EXISTS (SELECT 1 FROM options o WHERE o.poll_id = p.id AND o.duration_minutes > 0);

-- 1. Snap offset-baked all-day OPTION timestamps to UTC midnight of the
--    creator's intended date. Uses poll.time_zone, so it must run before step 3.
UPDATE "options" o
SET "start_time" = date_trunc(
  'day',
  (o."start_time" AT TIME ZONE 'UTC') AT TIME ZONE p."time_zone"
)
FROM "polls" p
WHERE o."poll_id" = p."id"
  AND o."duration_minutes" = 0
  AND p."time_zone" IS NOT NULL
  AND o."start_time"::time <> '00:00:00'
  AND p."time_zone" IN (SELECT name FROM pg_timezone_names);

-- 2. Same for all-day SCHEDULED EVENTS produced by finalizing those polls, so
--    the scheduled banner and re-exported calendar invites land on the right
--    date. Scoped to poll-linked events to stay within this bug's domain.
UPDATE "scheduled_events" e
SET
  "start" = date_trunc(
    'day',
    (e."start" AT TIME ZONE 'UTC') AT TIME ZONE e."time_zone"
  ),
  "end" = date_trunc(
    'day',
    (e."end" AT TIME ZONE 'UTC') AT TIME ZONE e."time_zone"
  )
WHERE e."all_day" = true
  AND e."time_zone" IS NOT NULL
  AND e."start"::time <> '00:00:00'
  AND e."time_zone" IN (SELECT name FROM pg_timezone_names)
  AND EXISTS (SELECT 1 FROM "polls" p WHERE p."scheduled_event_id" = e."id");

-- 3. Enforce the invariant: a date-only poll (has all-day options, no timed
--    options) carries no timezone. Runs last so steps 1-2 can still read it.
UPDATE "polls" p
SET "time_zone" = NULL
WHERE p."time_zone" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "options" o WHERE o."poll_id" = p."id" AND o."duration_minutes" = 0
  )
  AND NOT EXISTS (
    SELECT 1 FROM "options" o WHERE o."poll_id" = p."id" AND o."duration_minutes" > 0
  );
