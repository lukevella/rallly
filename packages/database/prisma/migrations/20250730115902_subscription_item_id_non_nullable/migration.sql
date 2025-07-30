/*
  Warnings:

  - Made the column `subscription_item_id` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "subscription_item_id" SET NOT NULL;
