-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "deleted_at" TIMESTAMP(3);

UPDATE "polls" SET "deleted_at" = now() WHERE "deleted" = true;