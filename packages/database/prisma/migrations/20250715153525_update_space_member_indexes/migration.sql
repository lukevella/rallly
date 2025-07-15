-- DropIndex
DROP INDEX "space_members_space_id_idx";

-- CreateIndex
CREATE INDEX "space_members_space_id_idx" ON "space_members" USING HASH ("space_id");

-- CreateIndex
CREATE INDEX "space_members_user_id_idx" ON "space_members" USING HASH ("user_id");
