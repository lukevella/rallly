-- CreateEnum
CREATE TYPE "scheduled_event_status" AS ENUM ('confirmed', 'canceled', 'unconfirmed');

-- CreateEnum
CREATE TYPE "scheduled_event_invite_status" AS ENUM ('pending', 'accepted', 'declined', 'tentative');

-- CreateTable
CREATE TABLE "scheduled_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "scheduled_event_status" NOT NULL DEFAULT 'confirmed',
    "time_zone" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rescheduled_event_dates" (
    "id" TEXT NOT NULL,
    "scheduled_event_id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rescheduled_event_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_event_invites" (
    "id" TEXT NOT NULL,
    "scheduled_event_id" TEXT NOT NULL,
    "invitee_name" TEXT NOT NULL,
    "invitee_email" TEXT NOT NULL,
    "invitee_id" TEXT,
    "invitee_time_zone" TEXT,
    "status" "scheduled_event_invite_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_event_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rescheduled_event_dates_scheduled_event_id_idx" ON "rescheduled_event_dates"("scheduled_event_id");

-- CreateIndex
CREATE INDEX "scheduled_event_invites_scheduled_event_id_idx" ON "scheduled_event_invites"("scheduled_event_id");

-- CreateIndex
CREATE INDEX "scheduled_event_invites_invitee_id_idx" ON "scheduled_event_invites"("invitee_id");

-- CreateIndex
CREATE INDEX "scheduled_event_invites_invitee_email_idx" ON "scheduled_event_invites"("invitee_email");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_event_invites_scheduled_event_id_invitee_email_key" ON "scheduled_event_invites"("scheduled_event_id", "invitee_email");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_event_invites_scheduled_event_id_invitee_id_key" ON "scheduled_event_invites"("scheduled_event_id", "invitee_id");

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescheduled_event_dates" ADD CONSTRAINT "rescheduled_event_dates_scheduled_event_id_fkey" FOREIGN KEY ("scheduled_event_id") REFERENCES "scheduled_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_event_invites" ADD CONSTRAINT "scheduled_event_invites_scheduled_event_id_fkey" FOREIGN KEY ("scheduled_event_id") REFERENCES "scheduled_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_event_invites" ADD CONSTRAINT "scheduled_event_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "scheduled_event_id" TEXT;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_scheduled_event_id_fkey" FOREIGN KEY ("scheduled_event_id") REFERENCES "scheduled_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
