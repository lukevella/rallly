import "server-only";

import { cache } from "react";
import { getNonprofitStatus } from "@/features/billing/nonprofit/data";
import { getActiveSpace } from "@/features/space/loaders";

export const loadNonprofitStatus = cache(async () => {
  const space = await getActiveSpace();
  return getNonprofitStatus(space.id);
});
