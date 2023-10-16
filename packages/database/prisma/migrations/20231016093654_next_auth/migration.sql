-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "time_format" "time_format",
ADD COLUMN     "time_zone" TEXT,
ADD COLUMN     "week_start" INTEGER;

-- Copy user preferences from old table
UPDATE "users" u
SET 
  "time_zone" = up."time_zone",
  "week_start" = up."week_start",
  "time_format" = up."time_format"
FROM "user_preferences" up
WHERE u.id = up."user_id";

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
