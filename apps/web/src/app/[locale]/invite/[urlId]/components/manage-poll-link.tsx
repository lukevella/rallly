"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { ArrowUpRightIcon } from "lucide-react";
import { Link } from "@/components/link";

/**
 * Takes the host to the poll's page. A guest host logs in first, since the
 * poll's page needs an account; logging in brings their guest polls along.
 * Client only because the click is tracked.
 */
export function ManagePollLink({
  pollId,
  loggedIn,
  children,
}: {
  pollId: string;
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const pollPage = `/polls/${pollId}`;
  return (
    <Link
      className={cn(buttonVariants(), "mr-1")}
      href={
        loggedIn
          ? pollPage
          : `/login?redirectTo=${encodeURIComponent(pollPage)}`
      }
      onClick={() => {
        posthog?.capture("poll_vote:manage_poll_link_click", {
          poll_id: pollId,
          logged_in: loggedIn,
        });
      }}
    >
      {children}
      <ArrowUpRightIcon data-icon="inline-end" />
    </Link>
  );
}
