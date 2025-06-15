-- DropIndex
DROP INDEX "comments_guest_id_idx";

-- DropIndex
DROP INDEX "participants_guest_id_idx";

-- DropIndex
DROP INDEX "polls_guest_id_idx";

-- CreateIndex
CREATE INDEX "polls_guest_id_idx" ON "polls" USING HASH ("guest_id");

-- CreateIndex
CREATE INDEX "polls_space_id_idx" ON "polls" USING HASH ("space_id");

-- CreateIndex
CREATE INDEX "polls_user_id_idx" ON "polls" USING HASH ("user_id");

-- CreateIndex
CREATE INDEX "scheduled_events_space_id_idx" ON "scheduled_events" USING HASH ("space_id");

-- CreateIndex
CREATE INDEX "scheduled_events_user_id_idx" ON "scheduled_events" USING HASH ("user_id");

-- CreateIndex
CREATE INDEX "spaces_owner_id_idx" ON "spaces" USING HASH ("owner_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING HASH ("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_space_id_idx" ON "subscriptions" USING HASH ("space_id");
