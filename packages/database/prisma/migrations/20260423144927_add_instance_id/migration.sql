/*
  Warnings:

  - A unique constraint covering the columns `[instance_id]` on the table `instance_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "instance_settings" ADD COLUMN     "instance_id" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "instance_settings_instance_id_key" ON "instance_settings"("instance_id");
