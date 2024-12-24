-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "guest_id" TEXT;

-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "guest_id" TEXT;

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "guest_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "comments_guest_id_idx" ON "comments" USING HASH ("guest_id");

-- CreateIndex
CREATE INDEX "participants_guest_id_idx" ON "participants" USING HASH ("guest_id");

-- CreateIndex
CREATE INDEX "polls_guest_id_idx" ON "polls" USING HASH ("guest_id");

-- Migrate polls
UPDATE "polls" p
SET 
    "guest_id" = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = p.user_id) THEN p.user_id 
        ELSE NULL 
    END,
    "user_id" = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = p.user_id) THEN NULL 
        ELSE p.user_id 
    END
WHERE p.user_id IS NOT NULL;

-- Migrate participants
UPDATE "participants" p
SET 
    "guest_id" = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = p.user_id) THEN p.user_id 
        ELSE NULL 
    END,
    "user_id" = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = p.user_id) THEN NULL 
        ELSE p.user_id 
    END
WHERE p.user_id IS NOT NULL;

-- Migrate comments
UPDATE "comments" c
SET 
    "guest_id" = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = c.user_id) THEN c.user_id 
        ELSE NULL 
    END,
    "user_id" = CASE 
        WHEN NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = c.user_id) THEN NULL 
        ELSE c.user_id 
    END
WHERE c.user_id IS NOT NULL;
