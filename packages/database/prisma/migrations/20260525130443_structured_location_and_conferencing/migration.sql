-- Add new structured location column (Json) and conferencing column (Json) on scheduled_events.
-- The existing free-text "location" String column is migrated into the new Json shape:
--   non-empty existing value -> { "provider": "custom", "address": <existing> }
-- Then the old String column is dropped and the new Json column takes its name.

ALTER TABLE "scheduled_events" ADD COLUMN "location_json" JSONB;
ALTER TABLE "scheduled_events" ADD COLUMN "conferencing" JSONB;

-- Backfill location_json from any existing non-empty free-text location.
UPDATE "scheduled_events"
SET "location_json" = jsonb_build_object('provider', 'custom', 'address', "location")
WHERE "location" IS NOT NULL AND "location" <> '';

-- Drop the legacy text column and promote the new Json column into its place.
ALTER TABLE "scheduled_events" DROP COLUMN "location";
ALTER TABLE "scheduled_events" RENAME COLUMN "location_json" TO "location";
