-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "api_poll_limit",
DROP COLUMN "api_poll_retained_limit",
ADD COLUMN     "api_addon_tier" TEXT,
ADD COLUMN     "api_poll_retained_tier" TEXT;

