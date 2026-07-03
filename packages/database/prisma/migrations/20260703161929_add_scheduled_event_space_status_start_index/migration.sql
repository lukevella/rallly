-- CreateIndex
CREATE INDEX "scheduled_events_space_id_status_start_idx" ON "scheduled_events"("space_id", "status", "start");
