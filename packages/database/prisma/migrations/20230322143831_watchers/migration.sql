-- CreateTable
CREATE TABLE "watchers" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchers_pkey" PRIMARY KEY ("id")
);

INSERT INTO watchers (poll_id, user_id)
SELECT id AS poll_id, user_id AS user_id
FROM polls
WHERE notifications = true;

-- AlterTable
ALTER TABLE "polls" DROP COLUMN "notifications",
ALTER COLUMN "author_name" DROP NOT NULL,
ALTER COLUMN "author_name" DROP DEFAULT,
DROP COLUMN "verified";

-- CreateIndex
CREATE INDEX "watchers_poll_id_idx" ON "watchers" USING HASH ("poll_id");
CREATE INDEX "watchers_user_id_idx" ON "watchers" USING HASH ("user_id");
