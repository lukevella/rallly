-- DropIndex
DROP INDEX "comments_poll_id_idx";

-- DropIndex
DROP INDEX "options_poll_id_idx";

-- DropIndex
DROP INDEX "participants_poll_id_idx";

-- DropIndex
DROP INDEX "votes_poll_id_idx";

-- CreateIndex
CREATE INDEX "comments_poll_id_idx" ON "comments" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "options_poll_id_idx" ON "options" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "participants_poll_id_idx" ON "participants" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "votes_poll_id_idx" ON "votes" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "votes_participant_id_idx" ON "votes" USING HASH ("participant_id");

-- CreateIndex
CREATE INDEX "votes_option_id_idx" ON "votes" USING HASH ("option_id");

-- CreateIndex
CREATE INDEX "watchers_poll_id_idx" ON "watchers" USING HASH ("poll_id");
