-- CreateIndex
CREATE INDEX "votes_option_id_idx" ON "votes" USING HASH ("option_id");
