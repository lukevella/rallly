import "server-only";

import { cache } from "react";
import { getInstanceSettings } from "./data";
import { getUpdateStatus } from "./service";

export const loadUpdateStatus = cache(async () => {
  const { instanceId } = await getInstanceSettings();

  if (!instanceId) {
    return null;
  }

  return getUpdateStatus({ instanceId });
});
