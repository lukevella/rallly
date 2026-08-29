-- AlterTable
ALTER TABLE "spaces" ADD COLUMN "shared" BOOLEAN NOT NULL DEFAULT false;

-- Existing multi-member spaces, and spaces with pending invites (sent when
-- shared visibility was the only semantics), keep today's behavior.
-- Single-member spaces have nobody to share with, so starting them
-- unshared changes nothing observable while giving them the same
-- privacy-safe first invite as new spaces.
UPDATE "spaces" SET "shared" = true
WHERE "id" IN (
    SELECT "space_id" FROM "space_members" GROUP BY "space_id" HAVING count(*) > 1
  )
  OR "id" IN (
    SELECT "space_id" FROM "space_member_invites"
  );
