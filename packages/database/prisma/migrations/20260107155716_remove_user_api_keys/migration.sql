/*
  Warnings:

  - You are about to drop the `api_keys` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_user_id_fkey";

-- DropTable
DROP TABLE "api_keys";
