/*
  Warnings:

  - You are about to drop the column `interval_count` on the `subscriptions` table. All the data in the column will be lost.
  - Made the column `currency` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `interval` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "interval_count",
ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "interval" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL;
