-- DropForeignKey
ALTER TABLE "poll_views" DROP CONSTRAINT IF EXISTS "poll_views_poll_id_fkey";
ALTER TABLE "poll_views" DROP CONSTRAINT IF EXISTS "poll_views_user_id_fkey";

-- DropTable
DROP TABLE "poll_views";
