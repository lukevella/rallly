-- CreateEnum
CREATE TYPE "space_content_visibility" AS ENUM ('space', 'owner');

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN "content_visibility" "space_content_visibility" NOT NULL DEFAULT 'space';
