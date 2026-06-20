/*
  Warnings:

  - You are about to drop the column `guest_id` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `guest_id` on the `participants` table. All the data in the column will be lost.
  - You are about to drop the column `guest_id` on the `polls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "comments" DROP COLUMN "guest_id";

-- AlterTable
ALTER TABLE "participants" DROP COLUMN "guest_id";

-- AlterTable
ALTER TABLE "polls" DROP COLUMN "guest_id";
