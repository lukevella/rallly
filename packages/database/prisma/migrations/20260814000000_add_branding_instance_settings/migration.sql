-- CreateEnum
CREATE TYPE "logo_size" AS ENUM ('sm', 'md', 'lg');

-- AlterTable
ALTER TABLE "instance_settings"
  ADD COLUMN "app_name" TEXT,
  ADD COLUMN "primary_color" TEXT,
  ADD COLUMN "primary_color_dark" TEXT,
  ADD COLUMN "logo" TEXT,
  ADD COLUMN "logo_dark" TEXT,
  ADD COLUMN "logo_icon" TEXT,
  ADD COLUMN "logo_size" "logo_size",
  ADD COLUMN "hide_attribution" BOOLEAN;
