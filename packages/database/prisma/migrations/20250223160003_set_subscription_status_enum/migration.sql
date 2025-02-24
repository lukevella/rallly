-- Add new enum values in a transaction
BEGIN;
ALTER TYPE "subscription_status" ADD VALUE 'incomplete';
ALTER TYPE "subscription_status" ADD VALUE 'incomplete_expired';
ALTER TYPE "subscription_status" ADD VALUE 'canceled';
ALTER TYPE "subscription_status" ADD VALUE 'unpaid';
COMMIT;

-- Now we can safely use the new enum values
-- AlterTable
ALTER TABLE "subscriptions" 
ADD COLUMN "status_enum" "subscription_status";

-- Migrate existing data
UPDATE "subscriptions" 
SET "status_enum" = "status"::"subscription_status";

-- Make the new column required
ALTER TABLE "subscriptions" 
ALTER COLUMN "status_enum" SET NOT NULL;

-- Drop the old column
ALTER TABLE "subscriptions" 
DROP COLUMN "status";

-- Rename the new column
ALTER TABLE "subscriptions"
RENAME COLUMN "status_enum" TO "status";
