-- A response that answered an emailed invite takes the invite's token, the
-- same rule the write path applies from now on, so the link the invitee
-- already holds names their response.
UPDATE "participants" p
SET "token" = i."token"
FROM "poll_invites" i
WHERE i."participant_id" = p."id"
  AND p."token" IS NULL;

-- Every other response gets hex from a v4 UUID: 32 characters, 122 bits of
-- randomness, and within the alphanumeric alphabet the app mints with. The
-- column stays nullable for one release: the code running while this
-- applies still inserts null tokens, so the NOT NULL constraint follows in a
-- later migration once every insert path mints.
UPDATE "participants"
SET "token" = replace(gen_random_uuid()::text, '-', '')
WHERE "token" IS NULL;
