-- DropTable
DROP TABLE "user_payment_data";

-- AlterEnum
BEGIN;
CREATE TYPE "subscription_status_new" AS ENUM ('incomplete', 'incomplete_expired', 'active', 'paused', 'trialing', 'past_due', 'canceled', 'unpaid');
ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "subscription_status_new" USING ("status"::text::"subscription_status_new");
ALTER TYPE "subscription_status" RENAME TO "subscription_status_old";
ALTER TYPE "subscription_status_new" RENAME TO "subscription_status";
DROP TYPE "subscription_status_old";
COMMIT;