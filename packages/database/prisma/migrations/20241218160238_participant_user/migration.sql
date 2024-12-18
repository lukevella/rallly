/*
  Warnings:

  - Made the column `user_id` on table `participants` required. This step will fail if there are existing NULL values in that column.

*/

-- AlterTable
ALTER TABLE "participants" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
