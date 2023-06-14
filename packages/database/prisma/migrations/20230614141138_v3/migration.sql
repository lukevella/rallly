-- CreateEnum
CREATE TYPE "time_format" AS ENUM ('hours12', 'hours24');

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "event_id" TEXT,
ADD COLUMN     "selected_option_id" TEXT;

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" TEXT NOT NULL,
    "time_zone" TEXT,
    "week_start" INTEGER,
    "time_format" "time_format",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start" TIMESTAMP(0) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_poll_id_key" ON "events"("poll_id");

-- CreateIndex
CREATE INDEX "events_poll_id_idx" ON "events" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "events_user_id_idx" ON "events" USING HASH ("user_id");
