"use client";

import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { StickerIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Spinner } from "@/components/spinner";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";
import type { PollStatus } from "@/features/poll/schema";
import { trpc } from "@/trpc/client";

interface PollsInfiniteListProps {
  status?: PollStatus;
  search?: string;
  member?: string;
  emptyState: React.ReactNode;
}

export function PollsInfiniteList({
  status,
  search,
  member,
  emptyState,
}: PollsInfiniteListProps) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
  } = trpc.polls.infiniteChronological.useInfiniteQuery(
    {
      status,
      search,
      member,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const polls = data?.pages?.flatMap((page) => page.polls) ?? [];

  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const handleLoadMore = React.useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  React.useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
      },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.unobserve(loadMoreElement);
    };
  }, [handleLoadMore]);

  if (queryStatus === "pending") {
    return <Spinner />;
  }

  if (queryStatus === "error") {
    return (
      <div className="py-8 text-center text-red-600">
        Error loading polls: {error?.message}
      </div>
    );
  }

  if (polls.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <StackedList>
      {polls.map(({ id, title, status, participants, user }) => (
        <StackedListItem key={id}>
          <div className="relative -m-4 flex min-w-0 flex-1 items-center gap-2 p-4">
            <PollStatusIcon status={status} showTooltip={false} />
            <Link
              className="min-w-0 text-sm hover:underline focus:ring-ring focus-visible:ring-2"
              href={absoluteUrl(`/poll/${id}`)}
            >
              <span className="absolute inset-0" />
              <span className="block truncate">{title}</span>
            </Link>
          </div>
          <div className="hidden items-center justify-end gap-4 sm:flex">
            {participants.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-muted-foreground text-sm">
                    <Trans
                      i18nKey="participantCount"
                      defaults="{count, plural, =0 {No participants} =1 {1 participant} other {# participants}}"
                      values={{ count: participants.length }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <ul>
                    {participants.slice(0, 10).map((participant) => (
                      <li key={participant.id}>{participant.name}</li>
                    ))}
                    {participants.length > 10 && (
                      <li>
                        <Trans
                          i18nKey="moreParticipants"
                          values={{ count: participants.length - 10 }}
                          defaults="{count} more…"
                        />
                      </li>
                    )}
                  </ul>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground text-sm">
                <Trans
                  i18nKey="participantCount"
                  defaults="{count, plural, =0 {No participants} =1 {1 participant} other {# participants}}"
                  values={{ count: participants.length }}
                />
              </span>
            )}
            {user && (
              <Tooltip>
                <TooltipTrigger>
                  <OptimizedAvatarImage
                    size="sm"
                    name={user.name}
                    src={user.image ?? undefined}
                  />
                </TooltipTrigger>
                <TooltipContent>{user.name}</TooltipContent>
              </Tooltip>
            )}
            <CopyLinkButton href={shortUrl(`/invite/${id}`)} />
          </div>
        </StackedListItem>
      ))}

      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2">
              <Spinner />
              <span className="text-muted-foreground text-sm">
                <Trans i18nKey="loading" defaults="Loading..." />
              </span>
            </div>
          )}
        </div>
      )}

      {!hasNextPage && data.pages.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
          <Icon>
            <StickerIcon />
          </Icon>
          <Trans
            i18nKey="endOfList"
            defaults="You've reached the end of the list"
          />
        </div>
      )}
    </StackedList>
  );
}
