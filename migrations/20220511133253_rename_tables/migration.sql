-- Rename types
ALTER TYPE "VoteType" RENAME TO "vote_type";
ALTER TYPE "Role" RENAME TO "role";
ALTER TYPE "PollType" RENAME TO "poll_type";

-- Rename tables
ALTER TABLE IF EXISTS "Comment" RENAME TO "comment";
ALTER TABLE IF EXISTS "Link" RENAME TO "link";
ALTER TABLE IF EXISTS "Option" RENAME TO "option";
ALTER TABLE IF EXISTS "Participant" RENAME TO "participant";
ALTER TABLE IF EXISTS "Poll" RENAME TO "poll";
ALTER TABLE IF EXISTS "User" RENAME TO "user";
ALTER TABLE IF EXISTS "Vote" RENAME TO "vote";

-- AlterTable
ALTER TABLE "comment" RENAME CONSTRAINT "Comment_pkey" TO "comment_pkey";

-- AlterTable
ALTER TABLE "link" RENAME CONSTRAINT "Link_pkey" TO "link_pkey";

-- AlterTable
ALTER TABLE "option" RENAME CONSTRAINT "Option_pkey" TO "option_pkey";

-- AlterTable
ALTER TABLE "participant" RENAME CONSTRAINT "Participant_pkey" TO "participant_pkey";

-- AlterTable
ALTER TABLE "poll" RENAME CONSTRAINT "Poll_pkey" TO "poll_pkey";

-- AlterTable
ALTER TABLE "user" RENAME CONSTRAINT "User_pkey" TO "user_pkey";

-- AlterTable
ALTER TABLE "vote" RENAME CONSTRAINT "Vote_pkey" TO "vote_pkey";

-- RenameForeignKey
ALTER TABLE "comment" RENAME CONSTRAINT "Comment_pollId_fkey" TO "comment_pollId_fkey";

-- RenameForeignKey
ALTER TABLE "comment" RENAME CONSTRAINT "Comment_userId_fkey" TO "comment_userId_fkey";

-- RenameForeignKey
ALTER TABLE "link" RENAME CONSTRAINT "Link_pollId_fkey" TO "link_pollId_fkey";

-- RenameForeignKey
ALTER TABLE "option" RENAME CONSTRAINT "Option_pollId_fkey" TO "option_pollId_fkey";

-- RenameForeignKey
ALTER TABLE "participant" RENAME CONSTRAINT "Participant_pollId_fkey" TO "participant_pollId_fkey";

-- RenameForeignKey
ALTER TABLE "participant" RENAME CONSTRAINT "Participant_userId_fkey" TO "participant_userId_fkey";

-- RenameForeignKey
ALTER TABLE "poll" RENAME CONSTRAINT "Poll_userId_fkey" TO "poll_userId_fkey";

-- RenameForeignKey
ALTER TABLE "vote" RENAME CONSTRAINT "Vote_optionId_fkey" TO "vote_optionId_fkey";

-- RenameForeignKey
ALTER TABLE "vote" RENAME CONSTRAINT "Vote_participantId_fkey" TO "vote_participantId_fkey";

-- RenameForeignKey
ALTER TABLE "vote" RENAME CONSTRAINT "Vote_pollId_fkey" TO "vote_pollId_fkey";

-- RenameIndex
ALTER INDEX "Comment_id_pollId_key" RENAME TO "comment_id_pollId_key";

-- RenameIndex
ALTER INDEX "Link_pollId_role_key" RENAME TO "link_pollId_role_key";

-- RenameIndex
ALTER INDEX "Link_urlId_key" RENAME TO "link_urlId_key";

-- RenameIndex
ALTER INDEX "Participant_id_pollId_key" RENAME TO "participant_id_pollId_key";

-- RenameIndex
ALTER INDEX "Poll_urlId_key" RENAME TO "poll_urlId_key";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "user_email_key";
