/*
  Warnings:

  - The primary key for the `polls` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `url_id` on the `polls` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `polls` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `polls` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Poll_urlId_key";

-- DropIndex
DROP INDEX "polls_url_id_key";

-- AlterTable
ALTER TABLE "polls"
RENAME COLUMN "url_id" TO "id";

-- CreateIndex
CREATE UNIQUE INDEX "polls_id_key" ON "polls"("id");
