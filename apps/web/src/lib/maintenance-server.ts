import "server-only";

import { cookies } from "next/headers";
import { AppError } from "@/lib/errors/app-error";
import {
  isMaintenanceModeEnabled,
  isValidBypassCookie,
  MAINTENANCE_BYPASS_COOKIE_NAME,
} from "@/lib/maintenance";

/**
 * Returns true when maintenance mode is enabled and the request does not
 * carry a valid bypass cookie. Must be called in request scope.
 */
export async function isMaintenanceActiveForRequest() {
  if (!isMaintenanceModeEnabled()) {
    return false;
  }

  const cookieStore = await cookies();
  const bypass = cookieStore.get(MAINTENANCE_BYPASS_COOKIE_NAME)?.value;

  if (bypass && (await isValidBypassCookie({ value: bypass }))) {
    return false;
  }

  return true;
}

export async function assertAppAvailable() {
  if (await isMaintenanceActiveForRequest()) {
    throw new AppError({
      code: "SERVICE_UNAVAILABLE",
      message: "The app is down for maintenance",
    });
  }
}
