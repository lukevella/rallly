-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_at" TIMESTAMP(3);
