-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- We need to get rid of duplicate email addresses in the users table
-- because the index was previously case sensitive

-- First we update all polls created by users with a duplicate email address
-- to a single user
UPDATE "Poll" p SET "userId" = u.id
FROM (
	SELECT min(id) id, array_agg(id) as "userIds"
	FROM "User" u
	GROUP BY lower(email)
	HAVING count(*) > 1
) u
WHERE p."userId" = any(u."userIds")
AND p."userId" <> u.id;

-- Remove all users that do not have polls
DELETE FROM "User" u
WHERE NOT EXISTS (SELECT * FROM "Poll" p WHERE u.id = p."userId");

-- Add citext extension
CREATE EXTENSION IF NOT EXISTS citext;

-- Change email to citext
ALTER TABLE "User"
ALTER COLUMN email TYPE citext;
