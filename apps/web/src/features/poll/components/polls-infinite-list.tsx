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
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CircleStopIcon,
  MoreHorizontalIcon,
  PlayIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { DataList } from "@/components/data-list";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { ListViewContent } from "@/components/list-view";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Spinner } from "@/components/spinner";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";
import type { PollClosedReason, PollStatus } from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { TimeRange } from "@/lib/datetime/time";
import type { DateInput } from "@/lib/datetime/types";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { trpc } from "@/trpc/client";

type PollRow = {
  id: string;
  title: string;
  status: PollStatus;
  closedReason: PollClosedReason | null;
  timeZone: string | null;
  participantCount: number;
  dateRange: { start: DateInput; end: DateInput } | null;
  user: { name: string; image: string | null } | null;
};

function PollDateRange({
  start,
  end,
  timeZone,
}: {
  start: DateInput;
  end: DateInput;
  timeZone: string | null;
}) {
  // A poll without a zone stores floating times (and all-day dates) as UTC
  // wall time, so show them as stored. Otherwise use the viewer's zone.
  return (
    <TimeRange
      start={start}
      end={end}
      preset="date"
      timeZone={timeZone === null ? "UTC" : undefined}
      className="truncate"
    />
  );
}

function PollTitleLink({
  id,
  title,
  status,
  closedReason,
}: {
  id: string;
  title: string;
  status: PollStatus;
  closedReason: PollClosedReason | null;
}) {
  const isPollAdminEnabled = useFeatureFlag("pollAdmin");
  return (
    <div className="flex min-w-0 items-center gap-2">
      <HoverPrefetchLink
        className="min-w-0 truncate text-sm outline-none after:absolute after:inset-0"
        href={isPollAdminEnabled ? `/polls/${id}` : absoluteUrl(`/poll/${id}`)}
      >
        {title}
      </HoverPrefetchLink>
      {status === "closed" && closedReason === "auto" && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                size="sm"
                className="relative z-10 hidden shrink-0 cursor-help sm:inline-flex"
              >
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
  );
}

function PollRowActions({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  status: PollStatus;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const deletePollDialog = useDialog();
  // Refresh server components so server-fetched data that depends on poll
  // status (e.g. the status filter counts) stays in sync with the list.
  const refresh = { onSuccess: () => router.refresh() };
  const deletePoll = trpc.polls.markAsDeleted.useMutation(refresh);
  const closePoll = trpc.polls.close.useMutation(refresh);
  const reopenPoll = trpc.polls.reopen.useMutation(refresh);
  return (
    <div className="relative z-10 flex items-center gap-x-1">
      <CopyLinkButton href={shortUrl(`/invite/${id}`)} className="size-8" />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("moreOptions", {
                defaultValue: "More options",
              })}
              variant="ghost"
              size="icon"
              className="size-8"
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "open" && (
            <DropdownMenuItem
              onClick={() => {
                toast.promise(closePoll.mutateAsync({ pollId: id }), {
                  loading: <Trans i18nKey="loading" defaults="Loading..." />,
                  success: (
                    <Trans i18nKey="pollClosed" defaults="Poll closed" />
                  ),
                });
              }}
            >
              <CircleStopIcon />
              <Trans i18nKey="closePoll" defaults="Close" />
            </DropdownMenuItem>
          )}
          {status === "closed" && (
            <DropdownMenuItem
              onClick={() => {
                toast.promise(reopenPoll.mutateAsync({ pollId: id }), {
                  loading: <Trans i18nKey="loading" defaults="Loading..." />,
                  success: (
                    <Trans i18nKey="pollReopened" defaults="Poll reopened" />
                  ),
                });
              }}
            >
              <PlayIcon />
              <Trans i18nKey="reopenPoll" defaults="Reopen poll" />
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => deletePollDialog.trigger()}>
            <TrashIcon />
            <span>
              <Trans i18nKey="deleteMenuItem" defaults="Delete" />
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
                  loading: <Trans i18nKey="loading" defaults="Loading..." />,
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
    </div>
  );
}

const columnHelper = createColumnHelper<PollRow>();

const columns = [
  columnHelper.accessor("status", {
    header: () => <Trans i18nKey="pollsListStatus" defaults="Status" />,
    cell: ({ getValue }) => (
      <PollStatusIcon status={getValue()} showTooltip={false} />
    ),
  }),
  columnHelper.accessor("title", {
    header: () => <Trans i18nKey="title" defaults="Title" />,
    cell: ({ row }) => (
      <PollTitleLink
        id={row.original.id}
        title={row.original.title}
        status={row.original.status}
        closedReason={row.original.closedReason}
      />
    ),
  }),
  columnHelper.accessor("dateRange", {
    header: () => <Trans i18nKey="pollsListDates" defaults="Dates" />,
    meta: {
      className: "hidden justify-end text-muted-foreground text-xs md:flex",
    },
    cell: ({ getValue, row }) => {
      const range = getValue();
      return range ? (
        <PollDateRange
          start={range.start}
          end={range.end}
          timeZone={row.original.timeZone}
        />
      ) : null;
    },
  }),
  columnHelper.accessor("participantCount", {
    header: () => <Trans i18nKey="participants" defaults="Participants" />,
    meta: {
      className: "hidden justify-end text-muted-foreground text-sm sm:flex",
    },
    cell: ({ getValue }) => (
      <span className="flex items-center gap-1.5 tabular-nums">
        <UsersIcon aria-hidden className="size-4" />
        <span aria-hidden>{getValue()}</span>
        <span className="sr-only">
          <Trans
            i18nKey="participantCount"
            defaults="{count, plural, =0 {No participants} one {1 participant} other {# participants}}"
            values={{ count: getValue() }}
          />
        </span>
      </span>
    ),
  }),
  columnHelper.accessor("user", {
    header: () => <Trans i18nKey="pollsListOrganizer" defaults="Organizer" />,
    meta: { className: "hidden sm:flex" },
    cell: ({ getValue }) => {
      const user = getValue();
      return user ? (
        <Tooltip>
          <TooltipTrigger className="relative z-10">
            <OptimizedAvatarImage
              size="sm"
              name={user.name}
              src={user.image ?? undefined}
            />
          </TooltipTrigger>
          <TooltipContent>{user.name}</TooltipContent>
        </Tooltip>
      ) : null;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <Trans i18nKey="pollsListActions" defaults="Actions" />,
    cell: ({ row }) => (
      <PollRowActions
        id={row.original.id}
        title={row.original.title}
        status={row.original.status}
      />
    ),
  }),
];

export function PollsInfiniteList({
  status,
  search,
  member,
  emptyState,
}: {
  status?: PollStatus;
  search?: string;
  member?: string;
  emptyState: React.ReactNode;
}) {
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

  const polls = React.useMemo(
    () => data.pages.flatMap((page) => page.polls),
    [data],
  );

  const table = useReactTable({
    data: polls,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (poll) => poll.id,
  });

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
    return <ListViewContent>{emptyState}</ListViewContent>;
  }

  return (
    <ListViewContent>
      <DataList
        table={table}
        className="grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] md:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto]"
      />
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
    </ListViewContent>
  );
}
