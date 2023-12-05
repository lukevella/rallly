/*
  Warnings:

  - You are about to drop the column `demo` on the `polls` table. All the data in the column will be lost.
  - You are about to drop the column `legacy` on the `polls` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[event_id]` on the table `polls` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "poll_status" AS ENUM ('live', 'paused', 'finalized');

-- AlterTable
ALTER TABLE "polls" DROP COLUMN "demo",
DROP COLUMN "legacy",
ADD COLUMN     "status" "poll_status";

-- CreateIndex
CREATE UNIQUE INDEX "polls_event_id_key" ON "polls"("event_id");

-- Fix an issue where the "event_id" column was not being set
UPDATE "polls"
SET "event_id" = "events"."id"
FROM "events"
WHERE "events"."poll_id" = "polls"."id";

-- Set the "status" column to corressponding enum value
-- If "closed" is true, set to "paused"
-- If a poll has an "event_id", set to "finalized"
-- If a poll has a "deletedAt" date, set to "deleted"
-- Otherwise set to "live"
UPDATE "polls"
SET "status" = CASE
  WHEN "closed" = true THEN 'paused'::poll_status
  WHEN "event_id" IS NOT NULL THEN 'finalized'::poll_status
  ELSE 'live'::poll_status
END;

-- Make the "status" column non-nullable and default to "live"
ALTER TABLE "polls"
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'live';


DROP INDEX "events_poll_id_idx";

-- DropIndex
DROP INDEX "events_poll_id_key";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "poll_id";