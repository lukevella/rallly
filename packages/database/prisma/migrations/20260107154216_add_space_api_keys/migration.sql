-- CreateTable
CREATE TABLE "space_api_keys" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hashed_key" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "space_api_keys_prefix_key" ON "space_api_keys"("prefix");

-- CreateIndex
CREATE INDEX "space_api_key_space_idx" ON "space_api_keys"("space_id");

-- CreateIndex
CREATE INDEX "space_api_key_expires_idx" ON "space_api_keys"("expires_at");

-- CreateIndex
CREATE INDEX "space_api_key_revoked_idx" ON "space_api_keys"("revoked_at");

-- AddForeignKey
ALTER TABLE "space_api_keys" ADD CONSTRAINT "space_api_keys_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
