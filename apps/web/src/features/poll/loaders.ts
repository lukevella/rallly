import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { getPoll, getPollStatusCounts } from "@/features/poll/data";
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
