-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_userId_fkey";

-- DropForeignKey
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_optionId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_participantId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_pollId_fkey";

-- Rename table
ALTER TABLE "Comment" RENAME TO "comments";

-- Rename table
ALTER TABLE "Link" RENAME TO "links";

-- Rename table
ALTER TABLE "Option" RENAME TO "options";

-- Rename table
ALTER TABLE "Participant" RENAME TO "participants";

-- Rename table
ALTER TABLE "Poll" RENAME TO "polls";

-- Rename table
ALTER TABLE "User" RENAME TO "users";

-- Rename table
ALTER TABLE "Vote" RENAME TO "votes";

-- Rename enum
ALTER TYPE "PollType" RENAME TO "poll_type";

-- Rename enum
ALTER TYPE "Role" RENAME TO "role";

-- Rename enum
ALTER TYPE "VoteType" RENAME TO "vote_type";

-- Rename fields
ALTER TABLE "comments" RENAME COLUMN "authorName" TO "author_name";
ALTER TABLE "comments" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "comments" RENAME COLUMN "guestId" TO "guest_id";
ALTER TABLE "comments" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "comments" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "comments" RENAME COLUMN "userId" TO "user_id";

-- Rename fields
ALTER TABLE "links" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "links" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "links" RENAME COLUMN "urlId" TO "url_id";

-- Rename fields
ALTER TABLE "options" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "options" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "options" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename fields
ALTER TABLE "participants" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "participants" RENAME COLUMN "guestId" TO "guest_id";
ALTER TABLE "participants" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "participants" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "participants" RENAME COLUMN "userId" TO "user_id";

-- Rename fields
ALTER TABLE "polls" RENAME COLUMN "authorName" TO "author_name";
ALTER TABLE "polls" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "polls" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "polls" RENAME COLUMN "timeZone" TO "time_zone";
ALTER TABLE "polls" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "polls" RENAME COLUMN "urlId" TO "url_id";

-- Rename fields
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename fields
ALTER TABLE "votes" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "votes" RENAME COLUMN "optionId" TO "option_id";
ALTER TABLE "votes" RENAME COLUMN "participantId" TO "participant_id";
ALTER TABLE "votes" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "votes" RENAME COLUMN "updatedAt" TO "updated_at";


-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "polls_url_id_key" ON "polls"("url_id");

-- CreateIndex
CREATE UNIQUE INDEX "links_url_id_key" ON "links"("url_id");

-- CreateIndex
CREATE UNIQUE INDEX "links_poll_id_role_key" ON "links"("poll_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "participants_id_poll_id_key" ON "participants"("id", "poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "comments_id_poll_id_key" ON "comments"("id", "poll_id");

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

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
