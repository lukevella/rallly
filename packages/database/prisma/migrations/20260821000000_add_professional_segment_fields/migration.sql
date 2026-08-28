-- CreateEnum
CREATE TYPE "space_types" AS ENUM ('personal', 'work');

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN "space_type" "space_types",
ADD COLUMN "industry" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "job_title" TEXT;
