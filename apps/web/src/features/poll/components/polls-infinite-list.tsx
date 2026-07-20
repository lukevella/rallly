"use client";

import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import {
  CircleStopIcon,
  MoreVerticalIcon,
  PlayIcon,
  StickerIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Spinner } from "@/components/spinner";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";
import type { PollClosedReason, PollStatus } from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

interface PollsInfiniteListProps {
  status?: PollStatus;
  search?: string;
  member?: string;
  emptyState: React.ReactNode;
}

function PollListItem({
  id,
  title,
  status,
  closedReason,
  participants,
  user,
}: {
  id: string;
  title: string;
  status: PollStatus;
  closedReason: PollClosedReason | null;
  participants: { id: string; name: string }[];
  user: { name: string; image: string | null } | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const deletePollDialog = useDialog();
  // Refresh server components so server-fetched data that depends on poll
  // status (e.g. the status tab counts) stays in sync with the list.
  const refresh = { onSuccess: () => router.refresh() };
  const deletePoll = trpc.polls.markAsDeleted.useMutation(refresh);
  const closePoll = trpc.polls.close.useMutation(refresh);
  const reopenPoll = trpc.polls.reopen.useMutation(refresh);
  return (
    <>
      <div className="grid w-full grid-cols-[1fr_auto] gap-2">
        <div className="relative -m-4 flex min-w-0 flex-1 items-center gap-2 p-4">
          <PollStatusIcon status={status} showTooltip={false} />
          <HoverPrefetchLink
            className="min-w-0 text-sm hover:underline focus:ring-ring focus-visible:ring-2"
            href={absoluteUrl(`/poll/${id}`)}
          >
            <span className="absolute inset-0" />
            <span className="block truncate">{title}</span>
          </HoverPrefetchLink>
          {status === "closed" && closedReason === "auto" && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Badge size="sm" className="relative cursor-help">
                    <Trans
                      i18nKey="pollAutoClosedBadge"
                      defaults="Automatically closed"
                    />
                  </Badge>
                }
              />
              <TooltipContent>
                <Trans
                  i18nKey="pollAutoClosedTooltip"
                  defaults="This poll was closed automatically because all of its dates have passed. You can reopen it at any time."
                />
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="hidden items-center justify-end gap-4 sm:flex">
          {participants.length > 0 ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="cursor-help text-muted-foreground text-sm">
                    <Trans
                      i18nKey="participantCount"
                      defaults="{count, plural, =0 {No participants} =1 {1 participant} other {# participants}}"
                      values={{ count: participants.length }}
                    />
                  </span>
                }
              />
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t("moreOptions", {
                    defaultValue: "More options",
                  })}
                  variant="ghost"
                  size="icon"
                />
              }
            >
              <MoreVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === "open" && (
                <DropdownMenuItem
                  onClick={() => {
                    toast.promise(closePoll.mutateAsync({ pollId: id }), {
                      loading: <Trans i18nKey="loading" defaults="Loading…" />,
                      success: (
                        <Trans i18nKey="pollClosed" defaults="Poll closed" />
                      ),
                    });
                  }}
                >
                  <Icon>
                    <CircleStopIcon />
                  </Icon>
                  <Trans i18nKey="closePoll" defaults="Close" />
                </DropdownMenuItem>
              )}
              {status === "closed" && (
                <DropdownMenuItem
                  onClick={() => {
                    toast.promise(reopenPoll.mutateAsync({ pollId: id }), {
                      loading: <Trans i18nKey="loading" defaults="Loading…" />,
                      success: (
                        <Trans
                          i18nKey="pollReopened"
                          defaults="Poll Reopened"
                        />
                      ),
                    });
                  }}
                >
                  <Icon>
                    <PlayIcon />
                  </Icon>
                  <Trans i18nKey="reopenPoll" defaults="Reopen" />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => deletePollDialog.trigger()}>
                <Icon>
                  <TrashIcon />
                </Icon>
                <span>
                  <Trans i18nKey="deleteMenuItem" defaults="Delete" />
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog {...deletePollDialog.dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="deletePoll" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="deletePollPrompt"
                defaults="Are you sure you want to delete <b>{title}</b>?"
                values={{ title }}
                components={{
                  b: <b className="font-bold" />,
                }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button />}>
              <Trans i18nKey="cancel" />
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                deletePollDialog.dismiss();
                toast.promise(deletePoll.mutateAsync({ pollId: id }), {
                  loading: <Trans i18nKey="loading" defaults="Loading…" />,
                  success: (
                    <Trans i18nKey="pollDeleted" defaults="Poll deleted" />
                  ),
                  error: (
                    <Trans
                      i18nKey="pollDeleteError"
                      defaults="Failed to delete poll"
                    />
                  ),
                });
              }}
              loading={deletePoll.isPending}
            >
              <Trans i18nKey="delete" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PollsInfiniteList({
  status,
  search,
  member,
  emptyState,
}: PollsInfiniteListProps) {
  const [data, { fetchNextPage, hasNextPage, isFetchingNextPage }] =
    trpc.polls.infiniteChronological.useSuspenseInfiniteQuery(
      {
        status,
        search,
        member,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const polls = data.pages.flatMap((page) => page.polls);

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

  if (polls.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <StackedList>
      {polls.map(({ id, title, status, closedReason, participants, user }) => (
        <StackedListItem key={id}>
          <PollListItem
            id={id}
            title={title}
            status={status}
            closedReason={closedReason}
            participants={participants}
            user={user}
          />
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
