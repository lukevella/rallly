-- AlterTable
ALTER TABLE "polls"
ADD COLUMN "admin_url_id" TEXT,
ADD COLUMN "participant_url_id" TEXT;

UPDATE polls
	SET participant_url_id=(SELECT url_id FROM links WHERE polls.url_id=links.poll_id AND links."role"='participant');

UPDATE polls
	SET admin_url_id=(SELECT url_id FROM links WHERE polls.url_id=links.poll_id AND links."role"='admin');

ALTER TABLE "polls"
ALTER COLUMN "admin_url_id" SET NOT NULL,
ALTER COLUMN "participant_url_id" SET NOT NULL;

-- DropTable
DROP TABLE "links";

-- DropEnum
DROP TYPE "role";

-- CreateIndex
CREATE UNIQUE INDEX "polls_participant_url_id_key" ON "polls"("participant_url_id");

-- CreateIndex
CREATE UNIQUE INDEX "polls_admin_url_id_key" ON "polls"("admin_url_id");
