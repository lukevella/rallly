-- AlterTable
ALTER TABLE "comments" ADD COLUMN "token" TEXT;

-- Every existing comment gets hex from a v4 UUID: 32 characters, 122 bits of
-- randomness, and within the alphanumeric alphabet the app mints with. No
-- browser holds these tokens, so the comments stay deletable only through
-- the session that wrote them or a poll admin, as before. The column stays
-- nullable for one release: the code running while this applies still
-- inserts comments without a token, so the NOT NULL constraint follows in a
-- later migration once every insert path mints.
UPDATE "comments"
SET "token" = replace(gen_random_uuid()::text, '-', '')
WHERE "token" IS NULL;
