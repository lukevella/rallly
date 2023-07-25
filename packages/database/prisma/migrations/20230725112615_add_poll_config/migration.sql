-- CreateEnum
CREATE TYPE "participant_visibility" AS ENUM ('full', 'scoresOnly', 'limited');

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "disable_comments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hide_scores" BOOLEAN NOT NULL DEFAULT false;
