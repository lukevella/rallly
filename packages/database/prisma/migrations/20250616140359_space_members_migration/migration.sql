-- Create space members with OWNER role for existing spaces
INSERT INTO "space_members" ("id", "space_id", "user_id", "created_at", "updated_at", "role")
SELECT 
  gen_random_uuid(),
  id as space_id, 
  owner_id as user_id, 
  NOW() as created_at, 
  NOW() as updated_at, 
  'OWNER' as role
FROM "spaces"
WHERE NOT EXISTS (
  SELECT 1 FROM "space_members" 
  WHERE "space_members"."space_id" = "spaces"."id" 
  AND "space_members"."user_id" = "spaces"."owner_id"
);