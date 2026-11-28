-- One response per email address on a poll. Addresses compare without case,
-- like poll_invites.email. Where a poll has several responses with the same
-- address, keep the earliest one and remove the others.

BEGIN;

-- Blocks new responses until the unique index is in place, so the release
-- that still serves traffic cannot add a duplicate in between.
LOCK TABLE participants IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE participants ALTER COLUMN email TYPE citext;

-- The form trims addresses and sends a blank one as no address, but older
-- rows can hold either.
UPDATE participants
SET email = NULLIF(btrim(email), '')
WHERE email IS DISTINCT FROM NULLIF(btrim(email), '');

CREATE TEMP TABLE duplicate_participants AS
SELECT id
FROM (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY poll_id, email ORDER BY created_at, id
    ) AS rank
  FROM participants
  WHERE email IS NOT NULL
) ranked
WHERE rank > 1;

-- An invite answered by a removed response goes back to pending with its
-- token intact, as when a response is deleted in the app. It is not moved to
-- the kept response: a typed email is unverified, so it never claims an
-- invite.
UPDATE poll_invites
SET participant_id = NULL
WHERE participant_id IN (SELECT id FROM duplicate_participants);

-- Votes cascade.
DELETE FROM participants
WHERE id IN (SELECT id FROM duplicate_participants);

CREATE UNIQUE INDEX "participants_poll_id_email_key" ON "participants"("poll_id", "email");

COMMIT;
