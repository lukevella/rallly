/*
  Warnings:

  - A unique constraint covering the columns `[id,poll_id]` on the table `participants` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "participants_id_poll_id_key" ON "participants"("id", "poll_id");
