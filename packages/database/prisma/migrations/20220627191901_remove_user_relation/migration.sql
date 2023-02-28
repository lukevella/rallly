/*
  Warnings:

  - You are about to drop the column `guest_id` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `guest_id` on the `participants` table. All the data in the column will be lost.

*/
-- Set user_id to guest_id
UPDATE "comments"
SET "user_id" = "guest_id"
WHERE "user_id" IS NULL;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "guest_id";

-- Set user_id to guest_id
UPDATE "participants"
SET "user_id" = "guest_id"
WHERE "user_id" IS NULL;

-- AlterTable
ALTER TABLE "participants" DROP COLUMN "guest_id";
