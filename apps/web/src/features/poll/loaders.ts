import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import {
  getPoll,
  getPollStatusCounts,
  listParticipantIdsByToken,
} from "@/features/poll/data";
import { getActiveSpaceContentScope } from "@/features/space/loaders";

export const loadPollStatusCounts = cache(async () => {
  const scope = await getActiveSpaceContentScope();
  return getPollStatusCounts({ scope });
});

export const loadPoll = cache(async (pollId: string) => {
  const scope = await getActiveSpaceContentScope();
  const poll = await getPoll({ pollId, scope });

  if (!poll) {
    notFound();
  }

  return poll;
});

/**
 * The token from the emailed link is its own proof of scope: no session is
 * consulted, so a forwarded link acts for the response it names.
 */
export const loadParticipantIdsByToken = cache(
  async (pollId: string, token: string) =>
    listParticipantIdsByToken({ pollId, token }),
);
