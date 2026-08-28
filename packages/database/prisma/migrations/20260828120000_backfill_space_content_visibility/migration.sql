-- Single-member spaces have nobody to share with, so flipping them to
-- independent changes nothing observable today while giving them the same
-- privacy-safe first invite as new spaces. Spaces with more than one member
-- keep shared visibility (today's behavior), and so do spaces with pending
-- invites: those invites were sent when shared visibility was the only
-- semantics, so the owner's expressed intent was to share.
UPDATE "spaces"
SET "content_visibility" = 'owner'
WHERE "content_visibility" = 'space'
  AND NOT EXISTS (
    SELECT 1 FROM "space_member_invites" i WHERE i."space_id" = "spaces"."id"
  )
  AND (
    SELECT count(*) FROM "space_members" m WHERE m."space_id" = "spaces"."id"
  ) <= 1;

-- AlterTable
ALTER TABLE "spaces" ALTER COLUMN "content_visibility" SET DEFAULT 'owner';
