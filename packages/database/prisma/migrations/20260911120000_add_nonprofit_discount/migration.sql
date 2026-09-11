-- Nonprofit discount: the entitlement lives on the space, each application
-- (approved, rejected or failed) is kept as an audit record of the automated
-- review.

-- CreateEnum
CREATE TYPE "nonprofit_application_status" AS ENUM ('approved', 'rejected', 'failed');

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN "nonprofit_discount_granted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "nonprofit_applications" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "email_domain" TEXT NOT NULL,
    "status" "nonprofit_application_status" NOT NULL,
    "reason" TEXT,
    "model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nonprofit_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nonprofit_applications_space_id_created_at_idx" ON "nonprofit_applications"("space_id", "created_at");

-- AddForeignKey
ALTER TABLE "nonprofit_applications" ADD CONSTRAINT "nonprofit_applications_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nonprofit_applications" ADD CONSTRAINT "nonprofit_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
