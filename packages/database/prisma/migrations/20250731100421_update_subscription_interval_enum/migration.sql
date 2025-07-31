/*
  Warnings:

  - The values [day,week] on the enum `subscription_interval` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "subscription_interval_new" AS ENUM ('month', 'year');
ALTER TABLE "subscriptions" ALTER COLUMN "interval" TYPE "subscription_interval_new" USING ("interval"::text::"subscription_interval_new");
ALTER TYPE "subscription_interval" RENAME TO "subscription_interval_old";
ALTER TYPE "subscription_interval_new" RENAME TO "subscription_interval";
DROP TYPE "subscription_interval_old";
COMMIT;
