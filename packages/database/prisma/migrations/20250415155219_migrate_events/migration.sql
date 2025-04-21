-- Step 1: Insert data from Event into ScheduledEvent
-- Reuse Event ID for ScheduledEvent ID
-- Calculate 'end': For all-day (duration 0), end is start + 1 day. Otherwise, calculate based on duration.
-- Set 'all_day' based on 'duration_minutes'
-- Fetch 'location' and 'time_zone' from the related Poll using event_id
-- Set defaults for other fields
INSERT INTO "scheduled_events" (
    "id",
    "user_id",
    "title",
    "description",
    "location",
    "created_at",
    "updated_at",
    "status",
    "time_zone",
    "start",
    "end",
    "all_day",
    "deleted_at"
)
SELECT
    e."id",                                     -- Reuse Event ID
    e."user_id",
    e."title",
    NULL,                                       -- Default description
    p."location",                               -- Get location from the related Poll
    e."created_at",
    NOW(),                                      -- Set updated_at to current time
    'confirmed'::"scheduled_event_status",      -- Default status 'confirmed'
    p."time_zone",                              -- Get timeZone from the related Poll
    e."start",
    -- Calculate 'end': If duration is 0 (all-day), set end to start + 1 day. Otherwise, calculate based on duration.
    CASE
        WHEN e."duration_minutes" = 0 THEN e."start" + interval '1 day'
        ELSE e."start" + (e."duration_minutes" * interval '1 minute')
    END,
    -- Set 'all_day': TRUE if duration is 0, FALSE otherwise
    CASE
        WHEN e."duration_minutes" = 0 THEN TRUE
        ELSE FALSE
    END,
    NULL                                        -- Default deletedAt to NULL
FROM
    "events" e
    LEFT JOIN "polls" p ON e."id" = p."event_id";
-- Step 2: Update the polls table to link to the new scheduled_event_id
-- Set scheduled_event_id = event_id where event_id was previously set
-- Only update if the corresponding ScheduledEvent was successfully created in Step 1
UPDATE "polls" p
SET "scheduled_event_id" = p."event_id"
WHERE p."event_id" IS NOT NULL;