-- CreateTable
CREATE TABLE "inbox_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbox_notifications_user_id_created_at_idx" ON "inbox_notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "inbox_notifications_activity_id_idx" ON "inbox_notifications"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_notifications_user_id_activity_id_key" ON "inbox_notifications"("user_id", "activity_id");

-- AddForeignKey
ALTER TABLE "inbox_notifications" ADD CONSTRAINT "inbox_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_notifications" ADD CONSTRAINT "inbox_notifications_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "poll_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: the last 30 days of responses, already read, so the inbox opens
-- with recent history instead of empty and the unread badge starts at zero.
-- Comments were not in the activity log before this release, so they have
-- nothing to backfill from.
INSERT INTO "inbox_notifications" ("id", "user_id", "activity_id", "read_at", "created_at")
SELECT gen_random_uuid()::text, p."user_id", a."id", a."created_at", a."created_at"
FROM "poll_activities" a
JOIN "polls" p ON p."id" = a."poll_id"
JOIN "users" u ON u."id" = p."user_id"
WHERE a."type" = 'response_created'
  AND a."created_at" > now() - interval '30 days'
  AND p."deleted" = false
  AND u."anonymous" = false
  AND a."user_id" IS DISTINCT FROM p."user_id";
