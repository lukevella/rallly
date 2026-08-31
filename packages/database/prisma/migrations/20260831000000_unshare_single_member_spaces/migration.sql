-- The 20260828000000 backfill also marked spaces with pending invites as
-- shared, on the theory that invites sent before the setting existed carried
-- shared-visibility expectations. That was wrong: a pending invitee has never
-- seen any content, so a single-member space being shared changes nothing
-- observable while telling its owner collaboration is on when they never
-- chose it. Realign shared with actual membership. Spaces that gained a
-- second member are left untouched — unsharing those would be observable.
UPDATE "spaces" SET "shared" = false
WHERE "shared" = true
  AND "id" NOT IN (
    SELECT "space_id" FROM "space_members" GROUP BY "space_id" HAVING count(*) > 1
  );
