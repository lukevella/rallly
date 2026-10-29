-- Restore any owner membership that has already gone missing, so every
-- space satisfies the invariant the trigger below protects.
INSERT INTO "space_members" ("id", "space_id", "user_id", "role", "created_at", "updated_at", "last_selected_at")
SELECT gen_random_uuid(), s."id", s."owner_id", 'ADMIN', now(), now(), now()
FROM "spaces" s
WHERE NOT EXISTS (
  SELECT 1 FROM "space_members" m
  WHERE m."space_id" = s."id" AND m."user_id" = s."owner_id"
)
ON CONFLICT ("space_id", "user_id") DO NOTHING;

-- A space's owner must always be a member of it: without the row the owner
-- is locked out of the app. Rejects deleting the row, or moving it to
-- another space or user, while the space and its owner both exist. Deleting
-- the space or the owner's account cascades through here after the parent
-- row is already gone, so those deletions pass.
CREATE OR REPLACE FUNCTION prevent_space_owner_membership_removal()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW."space_id" = OLD."space_id"
    AND NEW."user_id" = OLD."user_id" THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "spaces" s
    JOIN "users" u ON u."id" = s."owner_id"
    WHERE s."id" = OLD."space_id" AND s."owner_id" = OLD."user_id"
  ) THEN
    RAISE EXCEPTION 'Cannot remove the owner (%) from space %. Transfer ownership first.',
      OLD."user_id", OLD."space_id"
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_space_owner_membership_removal
BEFORE DELETE OR UPDATE OF "space_id", "user_id" ON "space_members"
FOR EACH ROW EXECUTE FUNCTION prevent_space_owner_membership_removal();
