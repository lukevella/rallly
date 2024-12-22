BEGIN;

DO $$
DECLARE
    votes_count INTEGER;
    comments_count INTEGER;
    participants_count INTEGER;
    options_count INTEGER;
    watchers_count INTEGER;
BEGIN
    -- Delete votes that reference non-existent polls
    WITH deleted AS (
        DELETE FROM votes v
        WHERE NOT EXISTS (
            SELECT 1 FROM polls p 
            WHERE p.id = v.poll_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO votes_count FROM deleted;
    RAISE NOTICE 'Deleted % orphaned votes', votes_count;

    -- Delete comments that reference non-existent polls
    WITH deleted AS (
        DELETE FROM comments c
        WHERE NOT EXISTS (
            SELECT 1 FROM polls p 
            WHERE p.id = c.poll_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO comments_count FROM deleted;
    RAISE NOTICE 'Deleted % orphaned comments', comments_count;

    -- Delete participants that reference non-existent polls
    WITH deleted AS (
        DELETE FROM participants p
        WHERE NOT EXISTS (
            SELECT 1 FROM polls poll 
            WHERE poll.id = p.poll_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO participants_count FROM deleted;
    RAISE NOTICE 'Deleted % orphaned participants', participants_count;

    -- Delete options that reference non-existent polls
    WITH deleted AS (
        DELETE FROM options o
        WHERE NOT EXISTS (
            SELECT 1 FROM polls p 
            WHERE p.id = o.poll_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO options_count FROM deleted;
    RAISE NOTICE 'Deleted % orphaned options', options_count;

    -- Delete watchers that reference non-existent polls
    WITH deleted AS (
        DELETE FROM watchers w
        WHERE NOT EXISTS (
            SELECT 1 FROM polls p 
            WHERE p.id = w.poll_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO watchers_count FROM deleted;
    RAISE NOTICE 'Deleted % orphaned watchers', watchers_count;

END $$;

COMMIT;
