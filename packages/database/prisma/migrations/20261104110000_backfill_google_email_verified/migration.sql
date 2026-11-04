-- Users who signed up with Google before Better Auth were created with a NULL
-- email_verified: the previous auth library never recorded verification for
-- OAuth sign-ups, and Better Auth does not refresh the flag on later sign-ins.
-- Mark a user verified when a stored Google ID token shows Google verified that
-- same address. Rows whose token is missing, unreadable or names another
-- address are left alone.

BEGIN;

CREATE FUNCTION pg_temp.id_token_claims(token text) RETURNS json AS $$
DECLARE
  payload text := translate(split_part(token, '.', 2), '-_', '+/');
BEGIN
  payload := rpad(payload, ((length(payload) + 3) / 4) * 4, '=');
  RETURN convert_from(decode(payload, 'base64'), 'UTF8')::json;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE users
SET email_verified = true
WHERE email_verified IS DISTINCT FROM true
  AND NOT anonymous
  AND EXISTS (
    SELECT 1
    FROM accounts
    CROSS JOIN LATERAL pg_temp.id_token_claims(accounts.id_token) AS claims
    WHERE accounts.user_id = users.id
      AND accounts.provider = 'google'
      AND accounts.id_token IS NOT NULL
      AND lower(claims ->> 'email') = lower(users.email::text)
      AND claims ->> 'email_verified' = 'true'
  );

DROP FUNCTION pg_temp.id_token_claims(text);

COMMIT;
