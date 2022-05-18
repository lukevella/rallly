/*
  Warnings:

  - You are about to drop the column `verificationCode` on the `Poll` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Poll_urlId_verificationCode_key";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "guestId" TEXT;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "guestId" TEXT;

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "verificationCode";
