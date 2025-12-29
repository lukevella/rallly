-- AlterTable
ALTER TABLE "instance_licenses" ADD COLUMN     "white_label_addon" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "licenses" ADD COLUMN     "white_label_addon" BOOLEAN NOT NULL DEFAULT false;
