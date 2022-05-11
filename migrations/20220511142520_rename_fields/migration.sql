-- DropForeignKey
ALTER TABLE "comment" DROP CONSTRAINT "comment_pollId_fkey";

-- DropForeignKey
ALTER TABLE "comment" DROP CONSTRAINT "comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "link" DROP CONSTRAINT "link_pollId_fkey";

-- DropForeignKey
ALTER TABLE "option" DROP CONSTRAINT "option_pollId_fkey";

-- DropForeignKey
ALTER TABLE "participant" DROP CONSTRAINT "participant_pollId_fkey";

-- DropForeignKey
ALTER TABLE "participant" DROP CONSTRAINT "participant_userId_fkey";

-- DropForeignKey
ALTER TABLE "vote" DROP CONSTRAINT "vote_optionId_fkey";

-- DropForeignKey
ALTER TABLE "vote" DROP CONSTRAINT "vote_participantId_fkey";

-- DropForeignKey
ALTER TABLE "vote" DROP CONSTRAINT "vote_pollId_fkey";

-- DropIndex
DROP INDEX "comment_id_pollId_key";

-- DropIndex
DROP INDEX "link_pollId_role_key";

-- DropIndex
DROP INDEX "link_urlId_key";

-- DropIndex
DROP INDEX "participant_id_pollId_key";

-- DropIndex
DROP INDEX "poll_urlId_key";

-- AlterTable
ALTER TABLE "comment" RENAME COLUMN "authorName" TO "author_name";
ALTER TABLE "comment" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "comment" RENAME COLUMN "guestId" TO "guest_id";
ALTER TABLE "comment" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "comment" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "comment" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "link" DROP CONSTRAINT "link_pkey";
ALTER TABLE "link" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "link" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "link" RENAME COLUMN "urlId" TO "url_id";
ALTER TABLE "link" ADD CONSTRAINT "link_pkey" PRIMARY KEY ("url_id");

-- AlterTable
ALTER TABLE "option" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "option" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "option" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "participant" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "participant" RENAME COLUMN "guestId" TO "guest_id";
ALTER TABLE "participant" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "participant" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "participant" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "poll" DROP CONSTRAINT "poll_pkey";
ALTER TABLE "poll" RENAME COLUMN "authorName" TO "author_name";
ALTER TABLE "poll" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "poll" RENAME COLUMN "timeZone" TO "time_zone";
ALTER TABLE "poll" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "poll" RENAME COLUMN "urlId" TO "url_id";
ALTER TABLE "poll" ADD CONSTRAINT "poll_pkey" PRIMARY KEY ("url_id");

-- AlterTable
ALTER TABLE "user" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "user" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "vote" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "vote" RENAME COLUMN "optionId" TO "option_id";
ALTER TABLE "vote" RENAME COLUMN "participantId" TO "participant_id";
ALTER TABLE "vote" RENAME COLUMN "pollId" TO "poll_id";
ALTER TABLE "vote" RENAME COLUMN "updatedAt" TO "updated_at";

-- CreateIndex
CREATE UNIQUE INDEX "comment_id_poll_id_key" ON "comment"("id", "poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "link_url_id_key" ON "link"("url_id");

-- CreateIndex
CREATE UNIQUE INDEX "link_poll_id_role_key" ON "link"("poll_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "participant_id_poll_id_key" ON "participant"("id", "poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "poll_url_id_key" ON "poll"("url_id");

-- AddForeignKey
ALTER TABLE "link" ADD CONSTRAINT "link_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "poll"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "poll"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option" ADD CONSTRAINT "option_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "poll"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "poll"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "poll"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;
