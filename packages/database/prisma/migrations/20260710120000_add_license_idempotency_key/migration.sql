-- AlterTable
ALTER TABLE "licenses" ADD COLUMN     "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "licenses_idempotency_key_key" ON "licenses"("idempotency_key");
