import "server-only";

import { cache } from "react";
import { getPollStatusCounts } from "@/features/poll/data";
import { getActiveSpace } from "@/features/space/loaders";

export const loadPollStatusCounts = cache(async () => {
  const space = await getActiveSpace();
  return getPollStatusCounts({ spaceId: space.id });
});
