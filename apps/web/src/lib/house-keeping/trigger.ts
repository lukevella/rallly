import "server-only";

import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { after } from "next/server";

const logger = createLogger("house-keeping/trigger");

/**
 * Runs a house-keeping task now instead of waiting for its schedule, by
 * invoking the cron route after the current response is sent. Only a
 * request can do this: `after` needs a request scope, so from a system
 * context (the cron itself, a script) the call is a no-op and the schedule
 * stays the guarantee. The task is idempotent by design, so a trigger that
 * races the cron costs a wasted run, never a double effect.
 *
 * The route acknowledges a triggered run before doing the work, so this
 * call returns in milliseconds; the timeout is only there so a stuck route
 * can never hold the caller.
 *
 * Lives in lib so any feature can call it without importing the feature
 * that owns the task; the graph stays acyclic.
 */
export function triggerHouseKeeping(
  task: "deliver-webhooks",
  query: Record<string, string>,
) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return;
  }

  try {
    after(async () => {
      try {
        const response = await fetch(
          absoluteUrl(`/api/house-keeping/${task}`, query),
          {
            headers: { Authorization: `Bearer ${secret}` },
            signal: AbortSignal.timeout(5_000),
          },
        );
        if (!response.ok) {
          logger.warn(
            { task, status: response.status },
            "House-keeping trigger was refused",
          );
        }
      } catch (error) {
        logger.warn({ task, error }, "House-keeping trigger failed");
      }
    });
  } catch {
    // No request scope; the scheduled run covers it.
  }
}
