import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { getPoll, getPollStatusCounts } from "@/features/poll/data";
import { getActiveSpace } from "@/features/space/loaders";

export const loadPollStatusCounts = cache(async () => {
  const space = await getActiveSpace();
  return getPollStatusCounts({ spaceId: space.id });
});

export const loadPoll = cache(async (pollId: string) => {
  const space = await getActiveSpace();
  const poll = await getPoll({ pollId, spaceId: space.id });

  if (!poll) {
    notFound();
  }

  return poll;
});
