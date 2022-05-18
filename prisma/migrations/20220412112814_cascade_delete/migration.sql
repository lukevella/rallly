-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Link" DROP CONSTRAINT "Link_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_pollId_fkey";

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("urlId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("urlId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("urlId") ON DELETE CASCADE ON UPDATE CASCADE;
