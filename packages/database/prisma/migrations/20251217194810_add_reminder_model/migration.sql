-- CreateEnum
CREATE TYPE "reminder_type" AS ENUM ('twentyFourHours', 'sixHours', 'oneHour');

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "reminder_type" "reminder_type" NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_poll_id_participant_id_reminder_type_idx" ON "reminders"("poll_id", "participant_id", "reminder_type");

-- CreateIndex
CREATE INDEX "reminders_poll_id_sent_at_idx" ON "reminders"("poll_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "reminders_poll_id_participant_id_reminder_type_key" ON "reminders"("poll_id", "participant_id", "reminder_type");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
