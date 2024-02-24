-- AlterTable
ALTER TABLE "options" ADD COLUMN     "start_time" TIMESTAMP(0);

-- migration.sql
DO
$do$
DECLARE
   poll_record RECORD;
BEGIN
   FOR poll_record IN SELECT id, "time_zone" FROM polls
   LOOP
      IF poll_record."time_zone" IS NULL OR poll_record."time_zone" = '' THEN
         UPDATE options
         SET "start_time" = "start"
         WHERE "poll_id" = poll_record.id;
      ELSE
         UPDATE options
         SET "start_time" = ("start"::TIMESTAMP WITHOUT TIME ZONE) AT TIME ZONE poll_record.time_zone
         WHERE "poll_id" = poll_record.id;
      END IF;
   END LOOP;
END
$do$;

-- Make start_time not null
ALTER TABLE "options" ALTER COLUMN "start_time" SET NOT NULL;

