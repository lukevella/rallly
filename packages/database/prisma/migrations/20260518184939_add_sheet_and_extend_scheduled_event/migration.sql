-- AlterTable: extend ScheduledEventInvite with locale and per-invite uid
ALTER TABLE "scheduled_event_invites" ADD COLUMN "invitee_locale" TEXT;
ALTER TABLE "scheduled_event_invites" ADD COLUMN "uid" TEXT;

-- Backfill uid for existing rows using the row id (already unique)
UPDATE "scheduled_event_invites" SET "uid" = "id" WHERE "uid" IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE "scheduled_event_invites" ALTER COLUMN "uid" SET NOT NULL;

-- AlterTable: extend ScheduledEvent with sheet/event-type provenance and capacity
ALTER TABLE "scheduled_events" ADD COLUMN "capacity" INTEGER,
ADD COLUMN "event_type_id" TEXT,
ADD COLUMN "sheet_slot_id" TEXT;

-- CreateTable
CREATE TABLE "sheets" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheet_slots" (
    "id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "event_type_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sheets_url_id_key" ON "sheets"("url_id");

-- CreateIndex
CREATE INDEX "sheets_space_id_idx" ON "sheets"("space_id");

-- CreateIndex
CREATE INDEX "sheets_host_id_idx" ON "sheets"("host_id");

-- CreateIndex
CREATE INDEX "sheet_slots_sheet_id_start_time_idx" ON "sheet_slots"("sheet_id", "start_time");

-- CreateIndex
CREATE INDEX "sheet_slots_event_type_id_idx" ON "sheet_slots"("event_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_event_invites_uid_key" ON "scheduled_event_invites"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_events_sheet_slot_id_key" ON "scheduled_events"("sheet_slot_id");

-- CreateIndex
CREATE INDEX "scheduled_events_event_type_id_idx" ON "scheduled_events"("event_type_id");

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_sheet_slot_id_fkey" FOREIGN KEY ("sheet_slot_id") REFERENCES "sheet_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_slots" ADD CONSTRAINT "sheet_slots_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_slots" ADD CONSTRAINT "sheet_slots_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
