-- migrate_event_votes_to_invites.sql V7
-- Migrate participants with emails from polls linked to events with a selected winning option (event.optionId)
-- into scheduled_event_invites for the corresponding scheduled_event (poll.scheduled_event_id).
-- Map the participant's vote on the winning option to the invite status.
-- Uses CTE with ROW_NUMBER() to handle potential duplicates based on email *and* user_id per scheduled event, preferring the most recent participant.
-- Uses NOT EXISTS in WHERE clause to avoid inserting invites if they already exist from other sources.
-- Reuses the participant's unique ID (pt.id) as the invite ID for this migration.
-- Excludes participants with NULL or empty string emails.

WITH PotentialInvites AS (
    SELECT
        pt.id as participant_id, -- Keep original participant ID for reuse
        p.scheduled_event_id,
        pt.name as invitee_name,
        pt.email as invitee_email,
        pt.user_id as invitee_id,
        u.time_zone as invitee_time_zone,
        v.type as vote_type,
        pt.created_at as participant_created_at,
        -- Assign row number partitioned by event and email, preferring most recent participant
        ROW_NUMBER() OVER(PARTITION BY p.scheduled_event_id, pt.email ORDER BY pt.created_at DESC) as rn_email,
        -- Assign row number partitioned by event and user_id (if not null), preferring most recent participant
        CASE
            WHEN pt.user_id IS NOT NULL THEN ROW_NUMBER() OVER(PARTITION BY p.scheduled_event_id, pt.user_id ORDER BY pt.created_at DESC)
            ELSE NULL
        END as rn_user
    FROM
        events e
    JOIN
        polls p ON e.id = p.event_id
    JOIN
        participants pt ON p.id = pt.poll_id
    LEFT JOIN
        votes v ON pt.id = v.participant_id AND e.option_id = v.option_id
    LEFT JOIN
        users u ON pt.user_id = u.id
    WHERE
        e.option_id IS NOT NULL
        AND p.scheduled_event_id IS NOT NULL
        AND pt.email IS NOT NULL
        AND pt.email != ''
        AND pt.deleted = false
)
INSERT INTO scheduled_event_invites (
    id,
    scheduled_event_id,
    invitee_name,
    invitee_email,
    invitee_id,
    invitee_time_zone,
    status,
    created_at,
    updated_at
)
SELECT
    pi.participant_id as id, -- Reuse participant's unique CUID as invite ID
    pi.scheduled_event_id,
    pi.invitee_name,
    pi.invitee_email,
    pi.invitee_id,
    pi.invitee_time_zone,
    CASE pi.vote_type
        WHEN 'yes' THEN 'accepted'::scheduled_event_invite_status
        WHEN 'ifNeedBe' THEN 'tentative'::scheduled_event_invite_status
        WHEN 'no' THEN 'declined'::scheduled_event_invite_status
        ELSE 'pending'::scheduled_event_invite_status
    END as status,
    NOW() as created_at,
    NOW() as updated_at
FROM
    PotentialInvites pi
WHERE
    pi.rn_email = 1 -- Only take the first row for each email/event combo
    AND (pi.invitee_id IS NULL OR pi.rn_user = 1) -- Only take the first row for each user_id/event combo (if user_id exists)
    -- Check for existing invite by email for the same scheduled event
    AND NOT EXISTS (
        SELECT 1
        FROM scheduled_event_invites sei
        WHERE sei.scheduled_event_id = pi.scheduled_event_id
          AND sei.invitee_email = pi.invitee_email
    )
    -- Check for existing invite by user ID for the same scheduled event (only if participant has a user ID)
    AND (pi.invitee_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM scheduled_event_invites sei
        WHERE sei.scheduled_event_id = pi.scheduled_event_id
          AND sei.invitee_id = pi.invitee_id
    ));