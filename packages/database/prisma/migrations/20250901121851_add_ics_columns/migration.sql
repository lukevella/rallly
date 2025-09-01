-- Step 1: Add sequence column and optional uid column
ALTER TABLE "scheduled_events" ADD COLUMN "sequence" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "scheduled_events" ADD COLUMN "uid" TEXT;

-- Step 2: Populate uid column for existing rows
UPDATE "scheduled_events" SET "uid" = "id" || '@rallly.co' WHERE "uid" IS NULL;

-- Step 3: Make uid column non-nullable and add unique constraint
ALTER TABLE "scheduled_events" ALTER COLUMN "uid" SET NOT NULL;
CREATE UNIQUE INDEX "scheduled_events_uid_key" ON "scheduled_events"("uid");
