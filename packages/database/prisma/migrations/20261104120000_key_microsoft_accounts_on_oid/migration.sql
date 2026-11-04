-- Better Auth 1.7 identifies Microsoft accounts by the `oid` claim instead of
-- `sub`. `sub` is pairwise per app registration, so it also differs whenever
-- the registration changes, while `oid` is stable for the user in a tenant.
-- Rekey each Microsoft account from the `oid` in its stored ID token. Rows
-- whose token is missing or unreadable are left alone and relink by email.

BEGIN;

CREATE FUNCTION pg_temp.microsoft_oid(token text) RETURNS text AS $$
DECLARE
  payload text := translate(split_part(token, '.', 2), '-_', '+/');
BEGIN
  payload := rpad(payload, ((length(payload) + 3) / 4) * 4, '=');
  RETURN nullif(convert_from(decode(payload, 'base64'), 'UTF8')::json ->> 'oid', '');
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TEMP TABLE microsoft_account_oids AS
SELECT
  id,
  oid,
  row_number() OVER (PARTITION BY oid ORDER BY created_at DESC, id DESC) AS rank
FROM (
  SELECT id, created_at, pg_temp.microsoft_oid(id_token) AS oid
  FROM accounts
  WHERE provider = 'microsoft' AND id_token IS NOT NULL
) tokens
WHERE oid IS NOT NULL;

-- A user who signed in through two app registrations has one row per
-- registration with the same `oid`. Keep the most recent one.
DELETE FROM accounts
USING microsoft_account_oids m
WHERE accounts.id = m.id AND m.rank > 1;

UPDATE accounts
SET provider_account_id = m.oid
FROM microsoft_account_oids m
WHERE accounts.id = m.id
  AND m.rank = 1
  AND accounts.provider_account_id <> m.oid
  AND NOT EXISTS (
    SELECT 1 FROM accounts other
    WHERE other.provider = 'microsoft'
      AND other.provider_account_id = m.oid
      AND other.id <> accounts.id
  );

DROP TABLE microsoft_account_oids;
DROP FUNCTION pg_temp.microsoft_oid(text);

COMMIT;
