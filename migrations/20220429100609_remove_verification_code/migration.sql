/*
  Warnings:

  - You are about to drop the column `verificationCode` on the `Poll` table. All the data in the column will be lost.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Poll_urlId_verificationCode_key";

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "verificationCode";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
