import type { PollStatus } from "@rallly/database";
import { Icon } from "@rallly/ui/icon";
import { UsersIcon } from "lucide-react";
import Link from "next/link";

import { ScheduledEventDisplay } from "@/components/poll/scheduled-event-display";
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

export const PollCard = ({ poll }: PollCardProps) => {
  return (
    <Link
      href={`/poll/${poll.id}`}
      className="group flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
    >
      <div className="mb-2 flex items-center justify-between">
        <PollStatusIcon status={poll.status} />
        <div className="text-muted-foreground text-xs">
          <RelativeDate date={poll.updatedAt} />
        </div>
      </div>
      <h3 className="mb-4 line-clamp-2 text-base font-medium text-gray-900 group-hover:underline">
        {poll.title}
      </h3>
      <div className="mt-auto space-y-2">
        <ScheduledEventDisplay
          event={poll.event}
          dateOptions={poll.dateOptions}
        />
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icon>
            <UsersIcon />
          </Icon>
          <span>
            {poll.participants.length}{" "}
            <Trans i18nKey="participants" defaults="participants" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export const RecentlyUpdatedPollsGrid = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </div>
  );
};
