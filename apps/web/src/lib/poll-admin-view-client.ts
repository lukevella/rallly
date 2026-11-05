"use client";

import { posthog } from "@rallly/posthog/client";
import Cookies from "js-cookie";
import {
  POLL_ADMIN_VIEW_COOKIE,
  POLL_ADMIN_VIEW_NEW,
} from "@/lib/poll-admin-view";

/**
 * Switches this browser between the poll admins. Each switch is an event for
 * the funnel and sets the person's current view, so the split of hosts on
 * each side can be read at any time.
 */
export function setPollAdminView({
  view,
  pollId,
}: {
  view: "new" | "legacy";
  pollId: string;
}) {
  if (view === "new") {
    Cookies.set(POLL_ADMIN_VIEW_COOKIE, POLL_ADMIN_VIEW_NEW, {
      path: "/",
      expires: 365,
      sameSite: "lax",
    });
  } else {
    Cookies.remove(POLL_ADMIN_VIEW_COOKIE, { path: "/" });
  }
  posthog?.capture(
    view === "new"
      ? "poll_admin:new_view_opt_in"
      : "poll_admin:new_view_opt_out",
    { poll_id: pollId, $set: { poll_admin_view: view } },
  );
}
