import type { WideEvent } from "@rallly/logger";
import type { UserDTO } from "@/features/user/schema";

export type TRPCContext = {
  user?: UserDTO;
  locale?: string;
  identifier?: string;
  event?: WideEvent;
  /**
   * The client's PostHog anonymous distinct_id, read from the posthog-js
   * persistence cookie. Used to stitch guest server-side captures to the
   * client's event stream. Absent when the cookie is missing or malformed.
   */
  anonymousDistinctId?: string;
};
