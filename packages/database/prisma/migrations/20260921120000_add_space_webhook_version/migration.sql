-- Pin each webhook endpoint to the payload contract it was built against.
-- Every endpoint that exists before this column was, by definition, built
-- against 2026-09-20, so the default is a correct backfill. New rows get the
-- value written by the app.

-- AlterTable
ALTER TABLE "space_webhooks" ADD COLUMN "version" TEXT NOT NULL DEFAULT '2026-09-20';
