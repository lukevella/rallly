"use client";

import { Icon } from "@rallly/ui/icon";
import { StickerIcon } from "lucide-react";
import React from "react";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { PollList, PollListItem } from "@/features/poll/components/poll-list";
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
    <PollList>
      {polls.map((poll) => (
        <PollListItem
          key={poll.id}
          title={poll.title}
          status={poll.status}
          participants={poll.participants.map((participant) => ({
            id: participant.id,
            name: participant.name,
            image: participant.image,
          }))}
          inviteLink={poll.inviteLink}
          pollLink={`/poll/${poll.id}`}
          createdBy={
            poll.user
              ? {
                  name: poll.user.name,
                  image: poll.user.image ?? undefined,
                }
              : undefined
          }
        />
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
    </PollList>
  );
}
