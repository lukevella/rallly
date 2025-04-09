"use client";

import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
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
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { ScheduledEventDisplay } from "@/components/poll/scheduled-event-display";
import { PollStatusIcon } from "@/components/poll-status-icon";
import { Trans } from "@/components/trans";

import { type PollRow } from "./columns";
import { PollActions } from "./poll-actions";

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
        <Card className="flex h-96 items-center justify-center">
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
        </Card>
      ) : (
        <div className="space-y-4">
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
  const { id, title, status, createdAt, participants, event, dateOptions } =
    poll;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/poll/${id}`} className="block p-4">
        <div className="flex flex-col space-y-3">
          {/* Title and Status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <PollStatusIcon status={status} />
              <h3 className="text-base font-medium">{title}</h3>
            </div>
            <div className="flex items-center">
              <PollActions pollId={id} />
            </div>
          </div>

          {/* Options Summary and Created Date */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <ScheduledEventDisplay event={event} dateOptions={dateOptions} />
            </div>
            <div className="flex items-center gap-1">
              <span>
                <Trans i18nKey="created" defaults="Created" />:
              </span>
              <span>{dayjs(createdAt).fromNow()}</span>
            </div>
            {event && (
              <div className="flex items-center gap-1">
                <span>
                  <Trans i18nKey="scheduled" defaults="Scheduled" />:
                </span>
                <span>{dayjs(event.start).format("MMM D, YYYY")}</span>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between">
            <ParticipantAvatarBar participants={participants} max={5} />
          </div>
        </div>
      </Link>
    </Card>
  );
}
