import "server-only";

import { cache } from "react";
import { loadInstanceLicense } from "@/features/licensing/data";
import { isSelfHosted } from "@/lib/constants";
import { isMaintenanceModeEnabled } from "@/lib/maintenance";
import { deriveInstancePolicy } from "./utils";

/**
 * Instance policy for the current request. Callable from any server
 * context (tRPC, API routes, emails, other features' data.ts); pages read
 * it through `loadInstancePolicy`.
 */
export const getInstancePolicy = cache(async () => {
  // The license lookup is skipped in maintenance mode so the maintenance
  // page can render while the database is unreachable; nothing that the
  // license gates renders there. loadInstanceLicense is null on cloud.
  const license = isMaintenanceModeEnabled()
    ? null
    : await loadInstanceLicense();

  return deriveInstancePolicy({
    isSelfHosted,
    whiteLabelAddon: license?.whiteLabelAddon ?? false,
  });
});
