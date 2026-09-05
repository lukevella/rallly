-- Rows inserted by the previous release between the backfill and its
-- promotion still carry no token. Same fill as the backfill.
UPDATE "participants"
SET "token" = replace(gen_random_uuid()::text, '-', '')
WHERE "token" IS NULL;

-- AlterTable
ALTER TABLE "participants" ALTER COLUMN "token" SET NOT NULL;
