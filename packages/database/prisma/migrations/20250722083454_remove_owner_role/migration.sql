/*
  Warnings:

  - The values [OWNER] on the enum `SpaceMemberRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
UPDATE "space_members" SET "role" = 'ADMIN' WHERE "role" = 'OWNER';
CREATE TYPE "SpaceMemberRole_new" AS ENUM ('ADMIN', 'MEMBER');
ALTER TABLE "space_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "space_members" ALTER COLUMN "role" TYPE "SpaceMemberRole_new" USING ("role"::text::"SpaceMemberRole_new");
ALTER TYPE "SpaceMemberRole" RENAME TO "SpaceMemberRole_old";
ALTER TYPE "SpaceMemberRole_new" RENAME TO "SpaceMemberRole";
DROP TYPE "SpaceMemberRole_old";
ALTER TABLE "space_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;
