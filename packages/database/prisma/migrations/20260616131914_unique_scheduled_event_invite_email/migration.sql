-- Collapse duplicate invites before adding the unique constraint. A poll can
-- have multiple participants with the same email, and finalizing it created one
-- invite per participant, so an event can hold several invites for the same
-- email. Keep one per (event, email): prefer an account-linked invite, then the
-- most committal status, then the most recent activity.
DELETE FROM "scheduled_event_invites"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "scheduled_event_id", "invitee_email"
        ORDER BY
          ("invitee_id" IS NOT NULL) DESC,
          CASE "status"
            WHEN 'accepted'  THEN 0
            WHEN 'tentative' THEN 1
            WHEN 'declined'  THEN 2
            WHEN 'pending'   THEN 3
          END,
          "updated_at" DESC NULLS LAST,
          "created_at" DESC,
          "id"
      ) AS rn
    FROM "scheduled_event_invites"
  ) ranked
  WHERE rn > 1
);

-- DropIndex
DROP INDEX "scheduled_event_invites_scheduled_event_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_event_invites_scheduled_event_id_invitee_email_key" ON "scheduled_event_invites"("scheduled_event_id", "invitee_email");
