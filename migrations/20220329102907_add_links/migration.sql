-- Create nanoid function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION nanoid(size int DEFAULT 21)
RETURNS text AS $$
DECLARE
  id text := '';
  i int := 0;
  urlAlphabet char(64) := 'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW';
  bytes bytea := gen_random_bytes(size);
  byte int;
  pos int;
BEGIN
  WHILE i < size LOOP
    byte := get_byte(bytes, i);
    pos := (byte & 63) + 1; -- + 1 because substr starts at 1 for some reason
    id := id || substr(urlAlphabet, pos, 1);
    i = i + 1;
  END LOOP;
  RETURN id;
END
$$ LANGUAGE PLPGSQL STABLE;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'participant');

-- CreateTable
CREATE TABLE "Link" (
    "urlId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "pollId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("urlId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Link_urlId_key" ON "Link"("urlId");

-- CreateIndex
CREATE UNIQUE INDEX "Link_pollId_role_key" ON "Link"("pollId", "role");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("urlId") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Link" ("urlId", "pollId", "role") SELECT "urlId", "urlId", 'admin' as "role" FROM "Poll";
INSERT INTO "Link" ("urlId", "pollId", "role") SELECT nanoid(), "urlId", 'participant' as "role" FROM "Poll";