-- Response deletion became a hard delete in #3191, the backlog was purged in
-- #3192, and the last read that filtered on these columns was removed in
-- #3193. Nothing writes them and nothing reads them, so they come out.
--
-- Ordering matters and is what makes this safe. On cloud the filter removal
-- was deployed before this migration ships, so no running instance queries
-- the dropped columns. On self hosted, migrations run in order at container
-- start before the server boots, so an instance upgrading across all four
-- changes applies the purge and this drop against code that already stopped
-- referencing them.
--
-- `response_deleted` PollActivity rows are the historical record of deleted
-- responses and are untouched: they hold their own name and vote snapshot and
-- reference the participant by a soft id with no FK.
ALTER TABLE "participants" DROP COLUMN "deleted",
DROP COLUMN "deleted_at";
