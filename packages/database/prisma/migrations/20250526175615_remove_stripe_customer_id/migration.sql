/*
  Warnings:

  - You are about to drop the column `stripe_customer_id` on the `licenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "licenses" DROP COLUMN "stripe_customer_id";
