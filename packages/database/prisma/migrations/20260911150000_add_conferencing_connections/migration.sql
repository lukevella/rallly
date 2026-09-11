-- Conferencing integrations: a connection per linked Zoom / Google Meet
-- account, and what the organizer asked for on a poll (a provider to mint a
-- link with at finalize, or a link they pasted).

-- AlterTable
ALTER TABLE "polls" ADD COLUMN "conferencing" JSONB;

-- CreateTable
CREATE TABLE "conferencing_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "credential_id" TEXT NOT NULL,

    CONSTRAINT "conferencing_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conferencing_connections_user_id_provider_provider_account_id_key" ON "conferencing_connections"("user_id", "provider", "provider_account_id");

-- AddForeignKey
ALTER TABLE "conferencing_connections" ADD CONSTRAINT "conferencing_connections_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferencing_connections" ADD CONSTRAINT "conferencing_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
