/*
  Warnings:

  - You are about to drop the column `session_state` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `accounts` table. All the data in the column will be lost.
  - The `email_verified` column on the `users` table is being converted from TIMESTAMP to BOOLEAN. Existing verification status is preserved.
  - Added the required column `updated_at` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "session_state",
DROP COLUMN "token_type",
DROP COLUMN "type",
ADD COLUMN     "access_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "refresh_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- Update existing accounts with updated_at
UPDATE "accounts" SET "updated_at" = "created_at"
WHERE "updated_at" IS NULL;

-- Make updated_at not nullable
ALTER TABLE "accounts" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable - Preserve existing email verification status
-- First add the new boolean column
ALTER TABLE "users" ADD COLUMN "email_verified_boolean" BOOLEAN;

-- Convert existing DateTime values to BOOLEAN (NULL stays NULL, any timestamp becomes TRUE)
UPDATE "users" SET "email_verified_boolean" = CASE 
  WHEN "email_verified" IS NOT NULL THEN TRUE 
  ELSE NULL 
END;

-- Drop the old column and rename the new one
ALTER TABLE "users" DROP COLUMN "email_verified";
ALTER TABLE "users" RENAME COLUMN "email_verified_boolean" TO "email_verified";

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
