/*
  Warnings:

  - Added the required column `option_id` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "option_id" TEXT NOT NULL;
