"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@rallly/ui/popover";
import { useMutation } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";

import React from "react";
import { Link } from "@/components/link";
import {
  markAllInboxNotificationsReadAction,
  markInboxNotificationReadAction,
} from "@/features/notifications/actions";
import type { ActivityEventType } from "@/features/notifications/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { trpc } from "@/trpc/client";

function InboxNotificationMessage({
  type,
  actorName,
  pollTitle,
}: {
  type: ActivityEventType;
  actorName: string;
  pollTitle: string;
}) {
  const components = { b: <span className="font-medium" /> };
  const values = { name: actorName, title: pollTitle };

  switch (type) {
    case "poll.response.submitted":
      return (
        <Trans
          i18nKey="inboxResponseSubmitted"
          defaults="<b>{name}</b> responded to <b>{title}</b>"
          values={values}
          components={components}
        />
      );
    case "poll.comment.added":
      return (
        <Trans
          i18nKey="inboxCommentAdded"
          defaults="<b>{name}</b> commented on <b>{title}</b>"
          values={values}
          components={components}
        />
      );
  }
}

export function InboxPopover() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const inbox = trpc.notifications.inbox.useInfiniteQuery(
    {},
    {
      getNextPageParam: (page) => page.nextCursor,
      // The inbox has no push channel yet, so poll while the app is open.
      refetchInterval: 60 * 1000,
    },
  );
  const markRead = useMutation({
    ...mutationOptions(markInboxNotificationReadAction),
    onSettled: () => inbox.refetch(),
  });
  const markAllRead = useMutation({
    ...mutationOptions(markAllInboxNotificationsReadAction),
    onSettled: () => inbox.refetch(),
  });

  const unreadCount = inbox.data?.pages[0]?.unreadCount ?? 0;
  const notifications =
    inbox.data?.pages.flatMap((page) => page.notifications) ?? [];

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          inbox.refetch();
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t("inboxUnreadLabel", {
              defaultValue:
                "{count, plural, =0 {Notifications} one {Notifications, 1 unread} other {Notifications, # unread}}",
              count: unreadCount,
            })}
          />
        }
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-medium text-[10px] text-primary-foreground tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <PopoverHeader className="flex-row items-center justify-between gap-2 border-b px-3 py-2">
          <PopoverTitle>
            <Trans i18nKey="notifications" defaults="Notifications" />
          </PopoverTitle>
          <Button
            size="xs"
            variant="ghost"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <Trans i18nKey="inboxMarkAllRead" defaults="Mark all as read" />
          </Button>
        </PopoverHeader>
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-muted-foreground">
            {inbox.isPending ? (
              <Trans i18nKey="loading" defaults="Loading..." />
            ) : (
              <Trans i18nKey="inboxEmpty" defaults="No notifications yet" />
            )}
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={`/polls/${notification.poll.id}`}
                  className="flex gap-2.5 px-3 py-2 hover:bg-accent focus-visible:bg-accent focus-visible:outline-hidden"
                  onClick={() => {
                    setOpen(false);
                    if (!notification.readAt) {
                      markRead.mutate({ notificationId: notification.id });
                    }
                  }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      notification.readAt ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block break-words",
                        notification.readAt && "text-muted-foreground",
                      )}
                    >
                      <InboxNotificationMessage
                        type={notification.type}
                        actorName={notification.actorName}
                        pollTitle={notification.poll.title}
                      />
                    </span>
                    <RelativeTime
                      value={notification.createdAt}
                      className="text-muted-foreground text-xs"
                    />
                  </span>
                </Link>
              </li>
            ))}
            {inbox.hasNextPage ? (
              <li className="px-3 py-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  disabled={inbox.isFetchingNextPage}
                  onClick={() => inbox.fetchNextPage()}
                >
                  <Trans i18nKey="inboxLoadMore" defaults="Load more" />
                </Button>
              </li>
            ) : null}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
