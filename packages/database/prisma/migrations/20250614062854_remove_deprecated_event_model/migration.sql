/*
  Warnings:

  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_user_id_fkey";

-- DropForeignKey
ALTER TABLE "polls" DROP CONSTRAINT "polls_event_id_fkey";

-- DropTable
DROP TABLE "events";
