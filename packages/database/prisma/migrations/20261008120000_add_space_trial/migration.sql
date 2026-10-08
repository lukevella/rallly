-- Free trial: the owner starts it once per space; the dates stay after it
-- ends so the space cannot start another.

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN "trial_started_at" TIMESTAMP(3),
ADD COLUMN "trial_ends_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "spaces_trial_ends_at_idx" ON "spaces"("trial_ends_at");
