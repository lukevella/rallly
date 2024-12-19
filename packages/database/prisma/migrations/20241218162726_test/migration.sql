-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_user_id_fkey";

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
