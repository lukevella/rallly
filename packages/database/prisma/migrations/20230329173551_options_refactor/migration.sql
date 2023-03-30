-- AlterTable
ALTER TABLE "options"
ADD COLUMN     "duration_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "start" TIMESTAMP(0);

-- AlterTable
ALTER TABLE "polls" DROP COLUMN "type";

-- DropEnum
DROP TYPE "poll_type";

-- Reformat option value into new columns
UPDATE "options"
SET "start" = CASE
    WHEN POSITION('/' IN "value") = 0 THEN (value || 'T00:00:00')::TIMESTAMP WITHOUT TIME ZONE
    ELSE SPLIT_PART("value", '/', 1)::TIMESTAMP WITHOUT TIME ZONE
  END,
   "duration_minutes" = CASE
    WHEN POSITION('/' IN "value") = 0 THEN 0
    ELSE
      LEAST(EXTRACT(EPOCH FROM (split_part("value", '/', 2)::timestamp - split_part("value", '/', 1)::timestamp)) / 60, 1440)
  END;

-- Fix cases where we have a negative duration due to the end time being in the past
-- eg. Some polls have value 2023-03-29T23:00:00/2023-03-29T01:00:00
UPDATE "options"
SET "duration_minutes" = "duration_minutes" + 1440
WHERE "duration_minutes" < 0;

-- Set start date to be not null now that we have all the data and drop the old value column
ALTER TABLE "options"
DROP COLUMN "value",
DROP COLUMN "updated_at",
ALTER COLUMN "start" SET NOT NULL;

