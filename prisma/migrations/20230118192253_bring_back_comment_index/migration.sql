-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments" USING HASH ("user_id");
