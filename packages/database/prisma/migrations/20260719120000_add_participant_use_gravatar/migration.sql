-- AlterTable
-- Whether the participant's email may be hashed and sent to Gravatar
-- (Automattic) to look up an avatar. Existing participants keep the previous
-- behaviour (lookup enabled); new participants can opt out at submission time.
ALTER TABLE "participants" ADD COLUMN "use_gravatar" BOOLEAN NOT NULL DEFAULT true;
