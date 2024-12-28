-- Clean up polls
DELETE FROM polls 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = polls.user_id);

-- Clean up participants
DELETE FROM participants pa
WHERE NOT EXISTS (
  SELECT 1 FROM polls p 
  WHERE p.id = pa.poll_id
);

DELETE FROM participants 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = participants.user_id);

-- Clean up options
DELETE FROM options o
WHERE NOT EXISTS (
  SELECT 1 FROM polls p 
  WHERE p.id = o.poll_id
);

-- Clean up votes
DELETE FROM votes v
WHERE NOT EXISTS (
  SELECT 1 FROM polls p 
  WHERE p.id = v.poll_id
);

DELETE FROM votes v
WHERE NOT EXISTS (
  SELECT 1 FROM participants p 
  WHERE p.poll_id = v.poll_id
  AND p.id = v.participant_id
);

DELETE FROM votes v
WHERE NOT EXISTS (
  SELECT 1 FROM options o 
  WHERE o.poll_id = v.poll_id
  AND o.id = v.option_id
);

-- Clean up comments
DELETE FROM comments c
WHERE NOT EXISTS (
  SELECT 1 FROM polls p 
  WHERE p.id = c.poll_id
);

DELETE FROM comments 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = comments.user_id);

-- Clean up watchers
DELETE FROM watchers w
WHERE NOT EXISTS (
  SELECT 1 FROM polls p 
  WHERE p.id = w.poll_id
);

DELETE FROM watchers 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = watchers.user_id);

-- Clean up events
DELETE FROM events 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = events.user_id);

-- Handle subscription updates
UPDATE users 
SET subscription_id = NULL 
WHERE subscription_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = users.subscription_id);

-- DropIndex
DROP INDEX "accounts_user_id_idx";

-- DropIndex
DROP INDEX "comments_user_id_idx";

-- DropIndex
DROP INDEX "polls_guest_id_idx";

-- DropIndex
DROP INDEX "polls_user_id_idx";

-- DropIndex
DROP INDEX "watchers_user_id_idx";

-- CreateIndex
CREATE INDEX "polls_guest_id_idx" ON "polls"("guest_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchers" ADD CONSTRAINT "watchers_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchers" ADD CONSTRAINT "watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
