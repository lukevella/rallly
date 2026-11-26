"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { ArrowUpRightIcon } from "lucide-react";
import { Link } from "@/components/link";

/** To the admin page, for someone who manages the poll. Client only because the click is tracked. */
export function ManagePollLink({
  pollId,
  children,
}: {
  pollId: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={cn(buttonVariants(), "mr-1")}
      href={`/poll/${pollId}`}
      onClick={() => {
        posthog?.capture("poll_vote:manage_poll_link_click", {
          poll_id: pollId,
        });
      }}
    >
      {children}
      <ArrowUpRightIcon data-icon="inline-end" />
    </Link>
  );
}
