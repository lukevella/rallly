-- DropIndex
DROP INDEX "polls_admin_url_id_key";

-- DropIndex
DROP INDEX "polls_participant_url_id_key";

-- AlterTable
ALTER TABLE "polls" DROP COLUMN "admin_url_id",
DROP COLUMN "participant_url_id";
