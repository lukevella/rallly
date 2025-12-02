/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `verifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_key" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");
