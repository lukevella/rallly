-- AlterTable
ALTER TABLE "instance_settings" ADD COLUMN     "app_name" TEXT,
ADD COLUMN     "primary_color" TEXT,
ADD COLUMN     "primary_color_dark" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "logo_url_dark" TEXT,
ADD COLUMN     "logo_icon_url" TEXT,
ADD COLUMN     "hide_attribution" BOOLEAN;
