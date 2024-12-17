-- CreateIndex
CREATE INDEX "comments_poll_id_idx" ON "comments"("poll_id");

-- CreateIndex
CREATE INDEX "options_poll_id_idx" ON "options"("poll_id");

-- CreateIndex
CREATE INDEX "participants_poll_id_idx" ON "participants"("poll_id");

-- CreateIndex
CREATE INDEX "polls_deleted_touched_at_idx" ON "polls"("deleted", "touched_at");

-- CreateIndex
CREATE INDEX "votes_poll_id_idx" ON "votes"("poll_id");
