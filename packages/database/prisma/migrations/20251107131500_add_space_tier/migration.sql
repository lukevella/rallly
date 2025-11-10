-- CreateEnum
CREATE TYPE "space_tiers" AS ENUM ('hobby', 'pro');

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "tier" "space_tiers" NOT NULL DEFAULT 'hobby';

-- Populate new column based on active subscriptions
UPDATE "spaces"
SET "tier" = 'pro'
WHERE EXISTS (
  SELECT 1
  FROM "subscriptions"
  WHERE "subscriptions"."space_id" = "spaces"."id"
    AND "subscriptions"."active" = true
);

