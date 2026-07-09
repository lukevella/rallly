-- All-day events must be floating (no time zone) and encoded as UTC midnight
-- day spans: the upcoming-events predicate, finalize emails, and ICS files all
-- read all-day dates via UTC (RAL-1257). Backfill the known violations, then
-- enforce the invariants with CHECK constraints.

-- Zoned all-day rows already at UTC midnight: drop the zone, keep the date.
-- These must NOT be snapped to the zone's calendar date, which would shift
-- them a day west of UTC. (2 rows in prod)
UPDATE scheduled_events
SET time_zone = NULL
WHERE all_day AND time_zone IS NOT NULL AND date_trunc('day', start) = start;

-- Zoned all-day rows NOT at UTC midnight were encoded at midnight in their
-- zone: snap to the zone's calendar date. (0 rows in prod; guard for
-- self-hosted databases)
UPDATE scheduled_events
SET start = date_trunc('day', start AT TIME ZONE 'UTC' AT TIME ZONE time_zone),
    "end" = date_trunc('day', start AT TIME ZONE 'UTC' AT TIME ZONE time_zone) + interval '1 day',
    time_zone = NULL
WHERE all_day AND time_zone IS NOT NULL;

-- Zero-length all-day rows from the end date bug fixed in #1926: restore the
-- 1 day span. (40 rows in prod)
UPDATE scheduled_events
SET "end" = start + interval '1 day'
WHERE all_day AND "end" <= start;

-- Any remaining all-day row off UTC midnight: snap to the UTC calendar date.
-- (0 rows in prod; guard for self-hosted databases so the constraints below
-- cannot fail the migration)
UPDATE scheduled_events
SET start = date_trunc('day', start),
    "end" = GREATEST(date_trunc('day', "end"), date_trunc('day', start) + interval '1 day')
WHERE all_day
  AND (date_trunc('day', start) <> start OR date_trunc('day', "end") <> "end");

ALTER TABLE scheduled_events
  ADD CONSTRAINT all_day_is_floating
    CHECK (NOT all_day OR time_zone IS NULL),
  ADD CONSTRAINT all_day_is_utc_midnight
    CHECK (NOT all_day OR (date_trunc('day', start) = start
                       AND date_trunc('day', "end") = "end"
                       AND "end" > start));
