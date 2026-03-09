/*
  Warnings:

  - You are about to drop the `watchers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "watchers" DROP CONSTRAINT "watchers_poll_id_fkey";

-- DropForeignKey
ALTER TABLE "watchers" DROP CONSTRAINT "watchers_user_id_fkey";

-- DropTable
DROP TABLE "watchers";
