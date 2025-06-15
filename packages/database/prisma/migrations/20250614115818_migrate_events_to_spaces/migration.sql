/*
  Warnings:

  - Added the required column `space_id` to the `scheduled_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "scheduled_events" ADD COLUMN     "space_id" TEXT;

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "scheduled_events" SET "space_id" = (SELECT "id" FROM "spaces" WHERE "owner_id" = "scheduled_events"."user_id" LIMIT 1);

ALTER TABLE "scheduled_events" ALTER COLUMN "space_id" SET NOT NULL;
