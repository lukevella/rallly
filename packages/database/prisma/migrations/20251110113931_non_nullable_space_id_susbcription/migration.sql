-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_space_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "space_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
