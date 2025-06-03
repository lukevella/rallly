import Link from "next/link";

import { CopyLinkButton } from "@/components/copy-link-button";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";

import type { PollStatus } from "../schema";

export const PollList = StackedList;

export function PollListItem({
  title,
  status,
  participants,
  inviteLink,
  pollLink,
}: {
  title: string;
  status: PollStatus;
  participants: { id: string; name: string; image?: string }[];
  inviteLink: string;
  pollLink: string;
}) {
  return (
    <StackedListItem>
      <div className="-m-4 relative flex min-w-0 flex-1 items-center gap-2 p-4">
        <PollStatusIcon status={status} showTooltip={false} />
        <Link
          className="min-w-0 font-medium text-sm hover:underline focus:ring-ring focus-visible:ring-2"
          href={pollLink}
        >
          <span className="absolute inset-0" />
          <span className="block truncate">{title}</span>
        </Link>
      </div>
      <div className="hidden items-center justify-end gap-4 sm:flex">
        <ParticipantAvatarBar participants={participants} max={5} />
        <CopyLinkButton href={inviteLink} />
      </div>
    </StackedListItem>
  );
}
