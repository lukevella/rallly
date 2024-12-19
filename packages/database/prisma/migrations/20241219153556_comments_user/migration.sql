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
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
