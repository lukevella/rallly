-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_pollsId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "links" DROP CONSTRAINT "links_pollsId_fkey";

-- DropForeignKey
ALTER TABLE "options" DROP CONSTRAINT "options_pollsId_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_pollsId_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_optionsId_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_participantsId_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_pollsId_fkey";

-- DropIndex
DROP INDEX "comments_id_pollsId_key";

-- DropIndex
DROP INDEX "links_pollsId_role_key";

-- DropIndex
DROP INDEX "links_urlId_key";

-- DropIndex
DROP INDEX "participants_id_pollsId_key";

-- DropIndex
DROP INDEX "polls_urlId_key";

-- AlterTable
ALTER TABLE "comments" RENAME COLUMN "authorName" TO "author_name";
ALTER TABLE "comments" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "comments" RENAME COLUMN "guestId" TO "guest_id";
ALTER TABLE "comments" RENAME COLUMN "pollsId" TO "polls_id";
ALTER TABLE "comments" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "comments" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "links" DROP CONSTRAINT "links_pkey";
ALTER TABLE "links" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "links" RENAME COLUMN "pollsId" TO "polls_id";
ALTER TABLE "links" RENAME COLUMN "urlId" TO "url_id";
ALTER TABLE "links" ADD CONSTRAINT "links_pkey" PRIMARY KEY ("url_id");

-- AlterTable
ALTER TABLE "options" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "options" RENAME COLUMN "pollsId" TO "polls_id";
ALTER TABLE "options" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "participants" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "participants" RENAME COLUMN "guestId" TO "guest_id";
ALTER TABLE "participants" RENAME COLUMN "pollsId" TO "polls_id";
ALTER TABLE "participants" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "participants" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "polls" DROP CONSTRAINT "polls_pkey";
ALTER TABLE "polls" RENAME COLUMN "authorName" TO "author_name";
ALTER TABLE "polls" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "polls" RENAME COLUMN "timeZone" TO "time_zone";
ALTER TABLE "polls" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "polls" RENAME COLUMN "urlId" TO "url_id";
ALTER TABLE "polls" ADD CONSTRAINT "polls_pkey" PRIMARY KEY ("url_id");

-- AlterTable
ALTER TABLE "user" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "user" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "votes" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "votes" RENAME COLUMN "optionsId" TO "options_id";
ALTER TABLE "votes" RENAME COLUMN "participantsId" TO "participants_id";
ALTER TABLE "votes" RENAME COLUMN "pollsId" TO "polls_id";
ALTER TABLE "votes" RENAME COLUMN "updatedAt" TO "updated_at";

-- CreateIndex
CREATE UNIQUE INDEX "comments_id_polls_id_key" ON "comments"("id", "polls_id");

-- CreateIndex
CREATE UNIQUE INDEX "links_url_id_key" ON "links"("url_id");

-- CreateIndex
CREATE UNIQUE INDEX "links_polls_id_role_key" ON "links"("polls_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "participants_id_polls_id_key" ON "participants"("id", "polls_id");

-- CreateIndex
CREATE UNIQUE INDEX "polls_url_id_key" ON "polls"("url_id");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_polls_id_fkey" FOREIGN KEY ("polls_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_polls_id_fkey" FOREIGN KEY ("polls_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_polls_id_fkey" FOREIGN KEY ("polls_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_polls_id_fkey" FOREIGN KEY ("polls_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_participants_id_fkey" FOREIGN KEY ("participants_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_options_id_fkey" FOREIGN KEY ("options_id") REFERENCES "options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_polls_id_fkey" FOREIGN KEY ("polls_id") REFERENCES "polls"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;
