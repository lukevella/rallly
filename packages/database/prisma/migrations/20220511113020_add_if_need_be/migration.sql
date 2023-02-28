-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('yes', 'no', 'ifNeedBe');

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "type" "VoteType" NOT NULL DEFAULT E'yes';
