-- Delete votes that reference non-existent polls
DELETE FROM votes v
WHERE NOT EXISTS (
    SELECT 1 FROM polls p 
    WHERE p.id = v.poll_id
);

-- Delete comments that reference non-existent polls
DELETE FROM comments c
WHERE NOT EXISTS (
    SELECT 1 FROM polls p 
    WHERE p.id = c.poll_id
);

-- Delete participants that reference non-existent polls
DELETE FROM participants p
WHERE NOT EXISTS (
    SELECT 1 FROM polls poll 
    WHERE poll.id = p.poll_id
);

-- Delete options that reference non-existent polls
DELETE FROM options o
WHERE NOT EXISTS (
    SELECT 1 FROM polls p 
    WHERE p.id = o.poll_id
);

-- Delete watchers that reference non-existent polls
DELETE FROM watchers w
WHERE NOT EXISTS (
    SELECT 1 FROM polls p 
    WHERE p.id = w.poll_id
);
