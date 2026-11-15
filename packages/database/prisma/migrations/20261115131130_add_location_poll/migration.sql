-- AlterEnum
ALTER TYPE "poll_kind" ADD VALUE 'location';

-- AlterTable
ALTER TABLE "options" ADD COLUMN     "address" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "start_time" DROP NOT NULL;
