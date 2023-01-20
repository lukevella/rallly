-- DropIndex
DROP INDEX "Participant_id_pollId_key";

-- DropIndex
DROP INDEX "participants_id_poll_id_key";

-- CreateIndex
CREATE INDEX "comments_poll_id_idx" ON "comments" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "options_poll_id_idx" ON "options" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "polls_user_id_idx" ON "polls" USING HASH ("user_id");

-- CreateIndex
CREATE INDEX "votes_poll_id_idx" ON "votes" USING HASH ("poll_id");
