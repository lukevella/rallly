-- DropIndex
DROP INDEX "comments_poll_id_idx";

-- DropIndex
DROP INDEX "polls_guest_id_idx";

-- DropIndex
DROP INDEX "polls_space_id_idx";

-- DropIndex
DROP INDEX "polls_user_id_idx";

-- DropIndex
DROP INDEX "scheduled_events_space_id_idx";

-- DropIndex
DROP INDEX "scheduled_events_user_id_idx";

-- DropIndex
DROP INDEX "space_member_invites_space_id_idx";

-- DropIndex
DROP INDEX "space_members_space_id_idx";

-- DropIndex
DROP INDEX "space_members_user_id_idx";

-- DropIndex
DROP INDEX "spaces_owner_id_idx";

-- DropIndex
DROP INDEX "subscriptions_space_id_idx";

-- DropIndex
DROP INDEX "subscriptions_user_id_idx";

-- CreateIndex
CREATE INDEX "comments_poll_id_idx" ON "comments"("poll_id");

-- CreateIndex
CREATE INDEX "polls_space_id_idx" ON "polls"("space_id");

-- CreateIndex
CREATE INDEX "polls_user_id_idx" ON "polls"("user_id");

-- CreateIndex
CREATE INDEX "scheduled_events_space_id_idx" ON "scheduled_events"("space_id");

-- CreateIndex
CREATE INDEX "scheduled_events_user_id_idx" ON "scheduled_events"("user_id");

-- CreateIndex
CREATE INDEX "space_members_user_id_idx" ON "space_members"("user_id");

-- CreateIndex
CREATE INDEX "spaces_owner_id_idx" ON "spaces"("owner_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_space_id_idx" ON "subscriptions"("space_id");
