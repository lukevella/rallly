-- Create guest users for participants without user_id and link them
DO $$
DECLARE
    participant_record RECORD;
BEGIN
    FOR participant_record IN 
        SELECT id, name, email 
        FROM participants 
        WHERE user_id IS NULL
    LOOP
        WITH new_user AS (
            INSERT INTO users (id, is_guest, created_at)
            VALUES (
                gen_random_uuid()::text,
                TRUE,
                NOW()
            )
            RETURNING id
        )
        UPDATE participants
        SET user_id = (SELECT id FROM new_user)
        WHERE id = participant_record.id;
    END LOOP;
END;
$$; 

-- Create guest users for comments without user_id and link them
DO $$
DECLARE
    comment_record RECORD;
BEGIN
    FOR comment_record IN 
        SELECT id, author_name 
        FROM comments 
        WHERE user_id IS NULL
    LOOP
        WITH new_user AS (
            INSERT INTO users (id, is_guest, created_at)
            VALUES (
                gen_random_uuid()::text,
                TRUE,
                NOW()
            )
            RETURNING id
        )
        UPDATE comments
        SET user_id = (SELECT id FROM new_user)
        WHERE id = comment_record.id;
    END LOOP;
END;
$$; 