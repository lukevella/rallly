"use client";

import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowUpRightFromSquareIcon,
  CalendarSearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  InboxIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PollStatusIcon } from "@/components/poll-status-icon";
import { ScheduledEventDisplay } from "@/components/poll/scheduled-event-display";
import { Trans } from "@/components/trans";

import { type PollRow } from "./columns";
import { PollActions } from "./poll-actions";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";

type PollsListProps = {
  polls: PollRow[];
  totalPolls: number;
  currentPage: number;
  totalPages: number;
};

export function PollsList({
  polls,
  totalPolls,
  currentPage,
  totalPages,
}: PollsListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get page size from URL or default to 20
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  // Calculate pagination values
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalPolls);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      {polls.length === 0 ? (
        <div className="flex h-96 items-center justify-center rounded-lg border">
          <EmptyState>
            <EmptyStateIcon>
              <InboxIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>
              <Trans i18nKey="noPollsFound" defaults="No polls found" />
            </EmptyStateTitle>
            <EmptyStateDescription>
              <Trans
                i18nKey="noPollsFoundDescription"
                defaults="You don't have any polls yet. Create one to get started!"
              />
            </EmptyStateDescription>
            <EmptyStateFooter>
              <Button variant="primary" asChild>
                <Link href="/new">
                  <Icon>
                    <PlusIcon />
                  </Icon>
                  <Trans i18nKey="createPoll" defaults="Create a poll" />
                </Link>
              </Button>
            </EmptyStateFooter>
          </EmptyState>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Trans
              i18nKey="showingPolls"
              defaults="Showing {startItem} to {endItem} of {totalPolls} polls"
              values={{ startItem, endItem, totalPolls }}
            />
          </div>
          <div className="flex items-center space-x-2">
            {currentPage > 1 && (
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Icon>
                  <ChevronLeftIcon />
                </Icon>
                <Trans i18nKey="newerPolls" defaults="Newer" />
              </Button>
            )}
            {currentPage < totalPages && (
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <Trans i18nKey="olderPolls" defaults="Older" />
                <Icon>
                  <ChevronRightIcon />
                </Icon>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PollCardProps {
  poll: PollRow;
}

function PollCard({ poll }: PollCardProps) {
  const { id, title, status, participants, event, dateOptions, user } = poll;

  // Determine if the duration is mixed (multiple different durations)
  const hasMixedDuration = Array.isArray(dateOptions.duration);

  // Format duration display
  const formatDuration = (duration: number) => {
    if (duration === 0) return "";
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const getDurationText = () => {
    if (hasMixedDuration) {
      return <Trans i18nKey="mixedDuration" defaults="Mixed" />;
    }
    if (typeof dateOptions.duration === "number") {
      return formatDuration(dateOptions.duration);
    }
    return "";
  };

  return (
    <div className="">
      <Link href={`/poll/${id}`} className="group block p-4 hover:bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-1 items-center gap-2">
            <PollStatusIcon status={status} />
            <h3 className="truncate text-sm font-medium group-hover:underline">
              {title}
            </h3>
          </div>
          <div>
            <ParticipantAvatarBar participants={participants} max={5} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Icon>
                <ArrowUpRightFromSquareIcon />
              </Icon>
            </Button>
            <Button variant="ghost" size="icon">
              <Icon>
                <CopyIcon />
              </Icon>
            </Button>
            <PollActions pollId={id} />
          </div>
        </div>
      </Link>
    </div>
  );
}
