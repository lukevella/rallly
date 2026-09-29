-- Manitoba stops falling back on 2026-11-01 and stays on UTC-5. No tz data
-- had the change when the app started resolving it, so every timed value in
-- a Manitoba zone that falls in a winter the old rules put on UTC-6 was
-- stored an hour late: 10:00 entered for Nov 5 became 16:00Z instead of
-- 15:00Z. Everyone saw 10:00 because every engine made the same mistake, so
-- shifting back an hour keeps what people see and makes the instant true.
--
-- Runs once, in the same release as the resolver, so every row it touches
-- was saved under the old rules. The old rules' winters run from the first
-- Sunday of November at 02:00 CDT (07:00 UTC) to the second Sunday of March
-- at 02:00 CST (08:00 UTC). They are built from that calendar rule rather
-- than with AT TIME ZONE, which would read Postgres's own, possibly stale,
-- tz data.
--
-- A timed event's end is its start plus its duration, so both move together.

CREATE TEMPORARY TABLE "old_manitoba_winters" AS
SELECT
  ("fall" + (7 - extract(dow FROM "fall")::int) % 7) + time '07:00' AS "start",
  ("spring" + (7 - extract(dow FROM "spring")::int) % 7 + 7) + time '08:00' AS "end"
FROM (
  SELECT make_date("year", 11, 1) AS "fall", make_date("year" + 1, 3, 1) AS "spring"
  FROM generate_series(2026, 2099) AS "year"
) AS "years";

UPDATE "options" SET "start_time" = "start_time" - interval '1 hour'
WHERE "duration_minutes" > 0
  AND "poll_id" IN (
    SELECT "id" FROM "polls"
    WHERE "time_zone" IN ('America/Winnipeg', 'Canada/Central')
  )
  AND EXISTS (
    SELECT 1 FROM "old_manitoba_winters" AS "winter"
    WHERE "options"."start_time" >= "winter"."start"
      AND "options"."start_time" < "winter"."end"
  );

UPDATE "scheduled_events"
SET "start" = "start" - interval '1 hour', "end" = "end" - interval '1 hour'
WHERE NOT "all_day"
  AND "time_zone" IN ('America/Winnipeg', 'Canada/Central')
  AND EXISTS (
    SELECT 1 FROM "old_manitoba_winters" AS "winter"
    WHERE "scheduled_events"."start" >= "winter"."start"
      AND "scheduled_events"."start" < "winter"."end"
  );

DROP TABLE "old_manitoba_winters";
