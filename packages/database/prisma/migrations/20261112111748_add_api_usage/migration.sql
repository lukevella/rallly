-- CreateEnum
CREATE TYPE "api_usage_resource" AS ENUM ('poll');

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "api_poll_quota_override" INTEGER;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "api_addon_amount" INTEGER,
ADD COLUMN     "api_addon_item_id" TEXT,
ADD COLUMN     "api_addon_price_id" TEXT,
ADD COLUMN     "api_poll_limit" INTEGER,
ADD COLUMN     "api_poll_retained_limit" INTEGER,
ADD COLUMN     "api_poll_retained_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "api_usage" (
    "space_id" TEXT NOT NULL,
    "resource" "api_usage_resource" NOT NULL,
    "period" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "near_limit_warned_at" TIMESTAMP(3),
    "at_limit_warned_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("space_id","resource","period")
);

-- AddForeignKey
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
