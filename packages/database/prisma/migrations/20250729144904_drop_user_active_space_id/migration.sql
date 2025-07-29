/*
  Warnings:

  - You are about to drop the column `active_space_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_active_space_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "active_space_id";
