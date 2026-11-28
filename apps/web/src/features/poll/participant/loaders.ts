import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { getVoterCookie, parseVoterTokens } from "./utils";

/**
 * The response tokens this browser holds for the poll. Not proof on their
 * own: the reads that use them check each against the database.
 */
export const loadVoterTokens = cache(async (pollId: string) => {
  const cookieStore = await cookies();
  return parseVoterTokens(cookieStore.get(getVoterCookie(pollId).name)?.value);
});
