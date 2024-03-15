-- CreateIndex
CREATE INDEX "votes_poll_id_idx" ON "votes" USING HASH ("poll_id");
