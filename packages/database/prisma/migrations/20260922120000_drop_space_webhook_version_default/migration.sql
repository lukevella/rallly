-- The default existed only to backfill rows that predate the column. With
-- the backfill done, a writer that forgets the version must fail rather than
-- silently record a stale contract when WEBHOOK_VERSION moves.

-- AlterTable
ALTER TABLE "space_webhooks" ALTER COLUMN "version" DROP DEFAULT;
