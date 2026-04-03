-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "primary_color" TEXT,
ADD COLUMN     "show_branding" BOOLEAN NOT NULL DEFAULT false;
