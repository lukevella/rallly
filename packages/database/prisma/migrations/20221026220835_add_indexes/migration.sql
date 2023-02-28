-- CreateIndex
CREATE INDEX "participants_poll_id_idx" ON "participants" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "votes_participant_id_idx" ON "votes" USING HASH ("participant_id");
