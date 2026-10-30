-- AlterTable
ALTER TABLE "options" ADD COLUMN     "max_participants" INTEGER;

-- RenameIndex
ALTER INDEX "conferencing_connections_user_id_provider_provider_account_id_k" RENAME TO "conferencing_connections_user_id_provider_provider_account__key";
