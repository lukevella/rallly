"use client";

import type { ScheduledEventStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { shortUrl } from "@rallly/utils/absolute-url";
import { MoreVerticalIcon } from "lucide-react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedList } from "@/components/stacked-list";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { isScheduledEventEnabled } from "@/features/scheduled-event/constants";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export const ScheduledEventList = StackedList;

export function ScheduledEventListItem({
  eventId,
  title,
  start,
  end,
  allDay,
  invites,
  timeZone,
  status,
  createdBy,
}: {
  eventId: string;
  title: string;
  status: ScheduledEventStatus;
  start: Date;
  end: Date;
  timeZone: string | null;
  allDay: boolean;
  invites: { id: string; inviteeName: string; inviteeImage?: string }[];
  createdBy: { name: string; image?: string };
}) {
  const { t } = useTranslation();
  const dialog = useDialog();
  const cancelEvent = trpc.events.cancel.useMutation({
    onSuccess: () => {
      dialog.dismiss();
    },
  });

  return (
    <div className="flex w-full gap-6">
      <div className="flex flex-1 flex-col gap-y-1 lg:flex-row-reverse lg:justify-end lg:gap-x-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-col gap-1">
              <span
                className={cn("font-medium", {
                  "line-through": status === "canceled",
                })}
              >
                {title}
              </span>
              <div className="text-muted-foreground text-sm">
                {invites.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="cursor-help">
                          <Trans
                            i18nKey="attendeeCount"
                            defaults="{count, plural, =0 {No attendees} one {1 attendee} other {# attendees}}"
                            values={{ count: invites.length }}
                          />
                        </span>
                      }
                    />
                    <TooltipContent>
                      <ul>
                        {invites.slice(0, 10).map((invite) => (
                          <li key={invite.id}>{invite.inviteeName}</li>
                        ))}
                        {invites.length > 10 && (
                          <li>
                            <Trans
                              i18nKey="moreParticipants"
                              values={{ count: invites.length - 10 }}
                              defaults="{count} more…"
                            />
                          </li>
                        )}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Trans
                    i18nKey="attendeeCount"
                    defaults="{count, plural, =0 {No attendees} one {1 attendee} other {# attendees}}"
                    values={{ count: invites.length }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center whitespace-nowrap text-sm lg:min-w-48">
          <div>
            <div className="font-medium">
              <EventDate value={start} allDay={allDay} timeZone={timeZone} />
            </div>
            <div className="text-muted-foreground">
              <EventTimeRange
                start={start}
                end={end}
                allDay={allDay}
                timeZone={timeZone}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <OptimizedAvatarImage
                size="sm"
                name={createdBy.name}
                src={createdBy.image}
              />
            </TooltipTrigger>
            <TooltipContent>{createdBy.name}</TooltipContent>
          </Tooltip>
        </div>
        {isScheduledEventEnabled && (
          <CopyLinkButton href={shortUrl(`/e/${eventId}`)} />
        )}
        {status !== "canceled" ? (
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
              <Icon>
                <MoreVerticalIcon />
              </Icon>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => dialog.trigger()}
              >
                <Trans i18nKey="cancelEvent" defaults="Cancel Event" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge>
            <Trans i18nKey="canceled" defaults="Canceled" />
          </Badge>
        )}
      </div>
      <Dialog {...dialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="cancelEvent" defaults="Cancel Event" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="cancelEventConfirmDescription"
                defaults="Are you sure you want to cancel this event?"
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="default" />}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </DialogClose>
            <Button
              variant="destructive"
              loading={cancelEvent.isPending}
              onClick={() =>
                cancelEvent.mutate({
                  eventId,
                })
              }
            >
              <Trans i18nKey="cancelEvent" defaults="Cancel Event" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
