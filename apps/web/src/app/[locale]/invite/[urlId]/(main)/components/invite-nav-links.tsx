"use client";

import { buttonVariants, cn } from "@rallly/ui";
import { CircleHelpIcon, ListChecksIcon } from "lucide-react";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { Link } from "@/components/link";
import { Trans } from "@/i18n/client";

function InviteNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "max-sm:px-2.5",
        active
          ? "bg-gray-200 text-foreground dark:bg-gray-800"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function InviteNavLinks({
  pollId,
  showComments,
  commentCount,
}: {
  pollId: string;
  showComments: boolean;
  commentCount?: number;
}) {
  const segment = useSelectedLayoutSegment();
  // Carries the emailed link's token between tabs, so the viewer's own
  // response is still recognized when they come back to the poll.
  const searchParams = useSearchParams();
  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  return (
    <nav className="flex items-center sm:gap-1">
      <InviteNavLink href={`/invite/${pollId}${query}`} active={!segment}>
        <ListChecksIcon className="hidden sm:block" />
        <Trans i18nKey="inviteNavVote" defaults="Vote" />
      </InviteNavLink>
      {showComments ? (
        <InviteNavLink
          href={`/invite/${pollId}/comments${query}`}
          active={segment === "comments"}
        >
          <Trans i18nKey="inviteNavComments" defaults="Comments" />
          {commentCount ? (
            <span className="rounded-full bg-gray-200 px-1.5 text-xs tabular-nums leading-5 dark:bg-gray-800">
              {commentCount}
            </span>
          ) : null}
        </InviteNavLink>
      ) : null}
      <InviteNavLink
        href={`/invite/${pollId}/help${query}`}
        active={segment === "help"}
      >
        <CircleHelpIcon className="hidden sm:block" />
        <Trans i18nKey="inviteNavHelp" defaults="Help" />
      </InviteNavLink>
    </nav>
  );
}
