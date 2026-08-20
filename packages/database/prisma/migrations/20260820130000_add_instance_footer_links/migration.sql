-- AlterTable
ALTER TABLE "instance_settings"
  ADD COLUMN "footer_links" JSONB NOT NULL DEFAULT '[]';
