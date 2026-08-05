-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "token" TEXT;

-- CreateTable
CREATE TABLE "poll_invites" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "token" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3),
    "reminded_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "participant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poll_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_activities" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" TEXT,
    "participant_id" TEXT,
    "invite_id" TEXT,
    "option_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "poll_invites_token_key" ON "poll_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "poll_invites_participant_id_key" ON "poll_invites"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "poll_invites_poll_id_email_key" ON "poll_invites"("poll_id", "email");

-- CreateIndex
CREATE INDEX "poll_activities_poll_id_created_at_idx" ON "poll_activities"("poll_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "poll_activities_poll_id_participant_id_idx" ON "poll_activities"("poll_id", "participant_id");

-- CreateIndex
CREATE INDEX "poll_activities_poll_id_option_id_idx" ON "poll_activities"("poll_id", "option_id");

-- CreateIndex
CREATE INDEX "poll_activities_poll_id_invite_id_idx" ON "poll_activities"("poll_id", "invite_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_token_key" ON "participants"("token");

-- AddForeignKey
ALTER TABLE "poll_invites" ADD CONSTRAINT "poll_invites_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_invites" ADD CONSTRAINT "poll_invites_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_activities" ADD CONSTRAINT "poll_activities_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

