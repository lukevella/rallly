-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('PLUS', 'ORGANIZATION', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "license_key" TEXT NOT NULL,
    "version" INTEGER,
    "type" "LicenseType" NOT NULL,
    "seats" INTEGER,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "licensee_email" TEXT,
    "licensee_name" TEXT,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripe_customer_id" TEXT,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_validations" (
    "id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "fingerprint" TEXT,
    "validated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,

    CONSTRAINT "license_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_licenses" (
    "id" TEXT NOT NULL,
    "license_key" TEXT NOT NULL,
    "version" INTEGER,
    "type" "LicenseType" NOT NULL,
    "seats" INTEGER,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "licensee_email" TEXT,
    "licensee_name" TEXT,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "instance_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_license_key_key" ON "licenses"("license_key");

-- CreateIndex
CREATE UNIQUE INDEX "instance_licenses_license_key_key" ON "instance_licenses"("license_key");

-- AddForeignKey
ALTER TABLE "license_validations" ADD CONSTRAINT "license_validations_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
