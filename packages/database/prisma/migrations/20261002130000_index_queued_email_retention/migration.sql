-- CreateIndex
CREATE INDEX "queued_emails_status_updated_at_idx" ON "queued_emails"("status", "updated_at");

