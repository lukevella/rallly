-- A falsy time zone means "floating" in app code, but '' is NOT NULL in SQL:
-- AT TIME ZONE '' errors and '' rows would fail the CHECK constraints planned
-- in RAL-1257. Normalize every time zone column so past rows match the
-- normalized writes.
UPDATE polls SET time_zone = NULL WHERE time_zone = '';
UPDATE scheduled_events SET time_zone = NULL WHERE time_zone = '';
UPDATE participants SET time_zone = NULL WHERE time_zone = '';
UPDATE scheduled_event_invites SET invitee_time_zone = NULL WHERE invitee_time_zone = '';
UPDATE users SET time_zone = NULL WHERE time_zone = '';
UPDATE provider_calendars SET time_zone = NULL WHERE time_zone = '';
