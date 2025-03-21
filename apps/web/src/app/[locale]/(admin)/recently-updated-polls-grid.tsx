import type { PollStatus } from "@rallly/database";
import { Badge } from "@rallly/ui/badge";
import { Icon } from "@rallly/ui/icon";
import { CalendarIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { PollStatusIcon } from "@/components/poll-status-icon";
import { RelativeDate } from "@/components/relative-date";
import { Trans } from "@/components/trans";

type Poll = {
  id: string;
  title: string;
  status: PollStatus;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    id: string;
    name: string;
    image?: string;
  }[];
  dateOptions: {
    first?: Date;
    last?: Date;
    count: number;
    duration: number | number[];
  };
  event?: {
    start: Date;
    duration: number;
  };
};

type PollCardProps = {
  poll: Poll;
};

const PollCard = ({ poll }: PollCardProps) => {
  return (
    <Link
      href={`/poll/${poll.id}`}
      className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <PollStatusIcon status={poll.status} />
        <div className="text-muted-foreground text-xs">
          <RelativeDate date={poll.updatedAt} />
        </div>
      </div>
      <h3 className="mb-4 line-clamp-2 text-base font-semibold text-gray-900">
        {poll.title}
      </h3>
      <div className="mt-auto space-y-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icon>
            <CalendarIcon />
          </Icon>
          {poll.dateOptions.count > 0 ? (
            <span>
              {poll.dateOptions.count}{" "}
              <Trans i18nKey="title" defaults="options" />
            </span>
          ) : (
            <span>
              <Trans i18nKey="event" defaults="No dates" />
            </span>
          )}
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icon>
            <UsersIcon />
          </Icon>
          <span>
            {poll.participants.length}{" "}
            <Trans i18nKey="participants" defaults="participants" />
          </span>
        </div>
        {poll.participants.length > 0 && (
          <ParticipantAvatarBar participants={poll.participants} max={5} />
        )}
      </div>
    </Link>
  );
};

export const RecentlyUpdatedPollsGrid = ({ polls }: { polls: Poll[] }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
};
