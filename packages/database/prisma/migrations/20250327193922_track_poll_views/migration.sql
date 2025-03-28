-- CreateTable
CREATE TABLE "poll_views" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_id" TEXT,
    "user_agent" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "poll_views_poll_id_idx" ON "poll_views" USING HASH ("poll_id");

-- CreateIndex
CREATE INDEX "poll_views_user_id_idx" ON "poll_views" USING HASH ("user_id");

-- CreateIndex
CREATE INDEX "poll_views_viewed_at_idx" ON "poll_views"("viewed_at");

-- AddForeignKey
ALTER TABLE "poll_views" ADD CONSTRAINT "poll_views_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_views" ADD CONSTRAINT "poll_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
