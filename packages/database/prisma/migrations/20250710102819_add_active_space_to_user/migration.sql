-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active_space_id" TEXT;

-- CreateIndex
CREATE INDEX "users_active_space_id_idx" ON "users"("active_space_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_active_space_id_fkey" FOREIGN KEY ("active_space_id") REFERENCES "spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Set active_space_id to each user's default space (where they are the owner)
UPDATE "users" u
SET "active_space_id" = (
  SELECT s.id 
  FROM "spaces" s 
  WHERE s."owner_id" = u.id 
  LIMIT 1
);
