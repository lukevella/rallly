DO $$
DECLARE
    batch_size INTEGER := 10000;
    total_rows INTEGER;
    offset_count INTEGER := 0;
BEGIN
    -- First create a temporary table with all distinct user_ids
    CREATE TEMP TABLE missing_users AS
    WITH all_users AS (
        SELECT user_id FROM polls
        UNION
        SELECT user_id FROM comments WHERE user_id IS NOT NULL
        UNION
        SELECT user_id FROM participants WHERE user_id IS NOT NULL
    )
    SELECT DISTINCT user_id
    FROM all_users a
    WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = a.user_id
    );

    -- Get the count
    SELECT COUNT(*) INTO total_rows FROM missing_users;
    
    RAISE NOTICE 'Starting migration of % missing users', total_rows;

    -- Process in batches
    WHILE offset_count < total_rows LOOP
        INSERT INTO users (id, is_guest, created_at)
        SELECT user_id as id, true as is_guest, NOW() as created_at
        FROM missing_users
        OFFSET offset_count
        LIMIT batch_size
        ON CONFLICT (id) DO NOTHING;

        offset_count := offset_count + batch_size;
        
        IF offset_count % 50000 = 0 THEN
            RAISE NOTICE 'Processed up to row %', offset_count;
        END IF;
        
        COMMIT;
    END LOOP;

    -- Clean up
    DROP TABLE missing_users;

    RAISE NOTICE 'Migration complete. Processed % rows', offset_count;
END $$;