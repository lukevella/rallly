-- Rename types
ALTER TYPE "VoteType" RENAME TO "vote_type";
ALTER TYPE "Role" RENAME TO "role";
ALTER TYPE "PollType" RENAME TO "poll_type";

-- Rename tables
ALTER TABLE IF EXISTS "Comment" RENAME TO "comments";
ALTER TABLE IF EXISTS "Link" RENAME TO "links";
ALTER TABLE IF EXISTS "Option" RENAME TO "options";
ALTER TABLE IF EXISTS "Participant" RENAME TO "participants";
ALTER TABLE IF EXISTS "Poll" RENAME TO "polls";
ALTER TABLE IF EXISTS "User" RENAME TO "users";
ALTER TABLE IF EXISTS "Vote" RENAME TO "votes";

-- AlterTable
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_pkey" TO "comments_pkey";

-- AlterTable
ALTER TABLE "links" RENAME CONSTRAINT "Link_pkey" TO "links_pkey";

-- AlterTable
ALTER TABLE "options" RENAME CONSTRAINT "Option_pkey" TO "options_pkey";

-- AlterTable
ALTER TABLE "participants" RENAME CONSTRAINT "Participant_pkey" TO "participants_pkey";

-- AlterTable
ALTER TABLE "polls" RENAME CONSTRAINT "Poll_pkey" TO "polls_pkey";

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";

-- AlterTable
ALTER TABLE "votes" RENAME CONSTRAINT "Vote_pkey" TO "votes_pkey";

-- RenameForeignKey
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_pollsId_fkey" TO "comments_pollsId_fkey";

-- RenameForeignKey
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_usersId_fkey" TO "comments_usersId_fkey";

-- RenameForeignKey
ALTER TABLE "links" RENAME CONSTRAINT "Link_pollsId_fkey" TO "links_pollsId_fkey";

-- RenameForeignKey
ALTER TABLE "options" RENAME CONSTRAINT "Option_pollsId_fkey" TO "options_pollsId_fkey";

-- RenameForeignKey
ALTER TABLE "participants" RENAME CONSTRAINT "Participant_pollsId_fkey" TO "participants_pollsId_fkey";

-- RenameForeignKey
ALTER TABLE "participants" RENAME CONSTRAINT "Participant_usersId_fkey" TO "participants_usersId_fkey";

-- RenameForeignKey
ALTER TABLE "polls" RENAME CONSTRAINT "Poll_usersId_fkey" TO "polls_usersId_fkey";

-- RenameForeignKey
ALTER TABLE "votes" RENAME CONSTRAINT "Vote_optionsId_fkey" TO "votes_optionsId_fkey";

-- RenameForeignKey
ALTER TABLE "votes" RENAME CONSTRAINT "Vote_participantsId_fkey" TO "votes_participantsId_fkey";

-- RenameForeignKey
ALTER TABLE "votes" RENAME CONSTRAINT "Vote_pollsId_fkey" TO "votes_pollsId_fkey";

-- RenameIndex
ALTER INDEX "Comment_id_pollsId_key" RENAME TO "comments_id_pollsId_key";

-- RenameIndex
ALTER INDEX "Link_pollsId_role_key" RENAME TO "links_pollsId_role_key";

-- RenameIndex
ALTER INDEX "Link_urlId_key" RENAME TO "links_urlId_key";

-- RenameIndex
ALTER INDEX "Participant_id_pollsId_key" RENAME TO "participants_id_pollsId_key";

-- RenameIndex
ALTER INDEX "Poll_urlId_key" RENAME TO "polls_urlId_key";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "users_email_key";
