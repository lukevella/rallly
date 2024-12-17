-- CreateIndex
CREATE INDEX "polls_deleted_deleted_at_idx" ON "polls"("deleted", "deleted_at");
