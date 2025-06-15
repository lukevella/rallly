INSERT INTO spaces (id, name, owner_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Personal', id, NOW(), NOW()
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM spaces WHERE spaces.owner_id = users.id
) ON CONFLICT DO NOTHING;

-- Set space_id for polls
UPDATE polls
SET space_id = spaces.id
FROM spaces
WHERE polls.user_id = spaces.owner_id AND polls.space_id IS NULL;

UPDATE subscriptions
SET space_id = spaces.id
FROM spaces
WHERE subscriptions.user_id = spaces.owner_id AND subscriptions.space_id IS NULL;