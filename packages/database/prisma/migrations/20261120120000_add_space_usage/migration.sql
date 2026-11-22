-- CreateEnum
CREATE TYPE "space_usage_resource" AS ENUM ('api_poll', 'email_invite');

-- CreateTable
CREATE TABLE "space_usage" (
    "space_id" TEXT NOT NULL,
    "resource" "space_usage_resource" NOT NULL,
    "period" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "near_limit_warned_at" TIMESTAMP(3),
    "at_limit_warned_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_usage_pkey" PRIMARY KEY ("space_id","resource","period")
);

-- AddForeignKey
ALTER TABLE "space_usage" ADD CONSTRAINT "space_usage_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy API poll usage across. api_usage stays until the code reading it is
-- gone, then a later migration drops it.
INSERT INTO "space_usage" ("space_id", "resource", "period", "count", "near_limit_warned_at", "at_limit_warned_at", "updated_at")
SELECT "space_id", 'api_poll', "period", "count", "near_limit_warned_at", "at_limit_warned_at", "updated_at"
FROM "api_usage"
WHERE "resource" = 'poll';
