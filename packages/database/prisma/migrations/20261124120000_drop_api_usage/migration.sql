-- DropForeignKey
ALTER TABLE "api_usage" DROP CONSTRAINT "api_usage_space_id_fkey";

-- DropTable
DROP TABLE "api_usage";

-- DropEnum
DROP TYPE "api_usage_resource";
