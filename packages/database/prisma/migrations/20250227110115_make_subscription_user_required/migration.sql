-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_subscription_id_fkey";

-- DropIndex
DROP INDEX "users_subscription_id_key";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "user_id" TEXT;

-- Populate user_id in subscriptions table using data from users table
UPDATE "subscriptions" s
SET "user_id" = u.id
FROM "users" u
WHERE u."subscription_id" = s.id;

-- Delete orphaned subscriptions (subscriptions without a corresponding user)
DELETE FROM "subscriptions" 
WHERE "user_id" IS NULL;

-- Make user_id NOT NULL after populating data
ALTER TABLE "subscriptions" ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "subscription_id";

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
