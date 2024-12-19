/*
  Warnings:

  - Made the column `user_id` on table `comments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `participants` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "participants" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
