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
}: {
  title: string;
  status: PollStatus;
  participants: { id: string; name: string; image?: string }[];
  inviteLink: string;
}) {
  return (
    <StackedListItem className="relative flex items-center gap-4 hover:bg-gray-50">
      <div className="relative flex flex-1 items-center gap-2 p-4">
        <PollStatusIcon status={status} showTooltip={false} />
        <Link
          className="focus:ring-ring min-w-0 text-sm font-medium hover:underline focus-visible:ring-2"
          href={inviteLink}
        >
          <span className="absolute inset-0" />
          <span className="block truncate">{title}</span>
        </Link>
      </div>
      <div className="z-10 hidden items-center justify-end gap-4 p-4 sm:flex">
        <ParticipantAvatarBar participants={participants} max={5} />
        <CopyLinkButton href={inviteLink} />
      </div>
    </StackedListItem>
  );
}
