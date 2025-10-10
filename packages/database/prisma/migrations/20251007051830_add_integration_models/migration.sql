-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('OAUTH');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "default_destination_calendar_id" TEXT;

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "secret" TEXT NOT NULL,
    "scopes" TEXT[],
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_connections" (
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

    CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_calendars" (
    "id" TEXT NOT NULL,
    "calendar_connection_id" TEXT NOT NULL,
    "provider_calendar_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "time_zone" TEXT,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "writable" BOOLEAN NOT NULL DEFAULT false,
    "provider_data" JSONB,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credential_expiry_idx" ON "credentials"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_user_id_provider_provider_account_id_key" ON "credentials"("user_id", "provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_connections_user_id_provider_provider_account_id_key" ON "calendar_connections"("user_id", "provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "connection_selected_idx" ON "provider_calendars"("calendar_connection_id", "selected");

-- CreateIndex
CREATE INDEX "primary_calendar_idx" ON "provider_calendars"("primary");

-- CreateIndex
CREATE INDEX "sync_time_idx" ON "provider_calendars"("last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_calendars_calendar_connection_id_provider_calendar_key" ON "provider_calendars"("calendar_connection_id", "provider_calendar_id");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_calendars" ADD CONSTRAINT "provider_calendars_calendar_connection_id_fkey" FOREIGN KEY ("calendar_connection_id") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_destination_calendar_id_fkey" FOREIGN KEY ("default_destination_calendar_id") REFERENCES "provider_calendars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
