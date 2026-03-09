/*
  Warnings:

  - You are about to drop the `watchers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "watchers" DROP CONSTRAINT "watchers_poll_id_fkey";

-- DropForeignKey
ALTER TABLE "watchers" DROP CONSTRAINT "watchers_user_id_fkey";

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "muted" BOOLEAN NOT NULL DEFAULT false;

-- Migrate: mark polls as muted where the creator had previously unwatched
UPDATE "polls" p
SET "muted" = true
WHERE p."user_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "watchers" w
    WHERE w."poll_id" = p."id" AND w."user_id" = p."user_id"
  );

-- DropTable
DROP TABLE "watchers";
