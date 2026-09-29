-- Manitoba stops falling back on 2026-11-01 and stays on UTC-5. No tz data
-- had the change when the app started resolving it, so every timed value in
-- a Manitoba zone that falls in a winter the old rules put on UTC-6 was
-- stored an hour late: 10:00 entered for Nov 5 became 16:00Z instead of
-- 15:00Z. Everyone saw 10:00 because every engine made the same mistake, so
-- shifting back an hour keeps what people see and makes the instant true.
--
-- Runs once, in the same release as the resolver, so every row it touches
-- was saved under the old rules. Windows are the old rules' standard time
-- periods in UTC, hard-coded rather than derived with AT TIME ZONE, which
-- would read Postgres's own, possibly stale, tz data.

UPDATE "options" SET "start_time" = "start_time" - interval '1 hour'
WHERE "duration_minutes" > 0
  AND "poll_id" IN (
    SELECT "id" FROM "polls"
    WHERE "time_zone" IN ('America/Winnipeg', 'Canada/Central')
  )
  AND (
    ("start_time" >= '2026-11-01 07:00' AND "start_time" < '2027-03-14 08:00')
    OR ("start_time" >= '2027-11-07 07:00' AND "start_time" < '2028-03-12 08:00')
    OR ("start_time" >= '2028-11-05 07:00' AND "start_time" < '2029-03-11 08:00')
  );

UPDATE "scheduled_events"
SET "start" = "start" - interval '1 hour', "end" = "end" - interval '1 hour'
WHERE NOT "all_day"
  AND "time_zone" IN ('America/Winnipeg', 'Canada/Central')
  AND (
    ("start" >= '2026-11-01 07:00' AND "start" < '2027-03-14 08:00')
    OR ("start" >= '2027-11-07 07:00' AND "start" < '2028-03-12 08:00')
    OR ("start" >= '2028-11-05 07:00' AND "start" < '2029-03-11 08:00')
  );
