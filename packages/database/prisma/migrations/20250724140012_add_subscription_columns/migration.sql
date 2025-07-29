-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "subscription_item_id" TEXT;
