BEGIN;

-- Create guest users for participants without user_id and link them
DO $$
DECLARE
    v_processed INTEGER := 0;
    v_total_processed INTEGER := 0;
    v_batch_size INTEGER := 1000;
BEGIN
    RAISE NOTICE 'Starting participant migration...';
    
    -- Process participants in batches
    LOOP
        WITH to_process AS (
            SELECT id, name, email 
            FROM participants 
            WHERE user_id IS NULL
            LIMIT v_batch_size
            FOR UPDATE SKIP LOCKED
        ),
        new_users AS (
            INSERT INTO users (id, is_guest, created_at)
            SELECT gen_random_uuid()::text, TRUE, NOW()
            FROM to_process
            RETURNING id
        )
        UPDATE participants p
        SET user_id = u.id
        FROM (
            SELECT id, ROW_NUMBER() OVER () as rn
            FROM new_users
        ) u
        WHERE p.id IN (
            SELECT id FROM to_process
        )
        AND p.user_id IS NULL;

        GET DIAGNOSTICS v_processed = ROW_COUNT;
        v_total_processed := v_total_processed + v_processed;
        
        EXIT WHEN v_processed = 0;
        RAISE NOTICE 'Processed % participants (total: %)', v_processed, v_total_processed;
    END LOOP;

    RAISE NOTICE 'Completed participant migration. Total processed: %', v_total_processed;
END;
$$;

-- Create guest users for comments without user_id and link them
DO $$
DECLARE
    v_processed INTEGER := 0;
    v_total_processed INTEGER := 0;
    v_batch_size INTEGER := 1000;
BEGIN
    RAISE NOTICE 'Starting comment migration...';
    
    -- Process comments in batches
    LOOP
        WITH to_process AS (
            SELECT id, author_name
            FROM comments 
            WHERE user_id IS NULL
            LIMIT v_batch_size
            FOR UPDATE SKIP LOCKED
        ),
        new_users AS (
            INSERT INTO users (id, is_guest, created_at)
            SELECT gen_random_uuid()::text, TRUE, NOW()
            FROM to_process
            RETURNING id
        )
        UPDATE comments c
        SET user_id = u.id
        FROM (
            SELECT id, ROW_NUMBER() OVER () as rn
            FROM new_users
        ) u
        WHERE c.id IN (
            SELECT id FROM to_process
        )
        AND c.user_id IS NULL;

        GET DIAGNOSTICS v_processed = ROW_COUNT;
        v_total_processed := v_total_processed + v_processed;
        
        EXIT WHEN v_processed = 0;
        RAISE NOTICE 'Processed % comments (total: %)', v_processed, v_total_processed;
    END LOOP;

    RAISE NOTICE 'Completed comment migration. Total processed: %', v_total_processed;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error during comment migration: %', SQLERRM;
    RAISE;
END;
$$;

COMMIT; 