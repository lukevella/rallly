"use client";

import type { ScheduledEventStatus } from "@rallly/database";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedList } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { useSafeAction } from "@/lib/safe-action/client";
import { FormattedDateTime } from "@/lib/timezone/client/formatted-date-time";
import { cancelEventAction } from "../actions";

export const ScheduledEventList = StackedList;

export function ScheduledEventListItem({
  eventId,
  title,
  start,
  end,
  allDay,
  invites,
  floating: isFloating,
  status,
  createdBy,
}: {
  eventId: string;
  title: string;
  status: ScheduledEventStatus;
  start: Date;
  end: Date;
  allDay: boolean;
  invites: { id: string; inviteeName: string; inviteeImage?: string }[];
  floating: boolean;
  createdBy: { name: string; image?: string };
}) {
  const cancelEvent = useSafeAction(cancelEventAction);
  return (
    <div className="flex w-full gap-6">
      <div className="flex flex-1 flex-col gap-y-1 lg:flex-row-reverse lg:justify-end lg:gap-x-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <div className="font-medium">{title}</div>
              <div className="text-muted-foreground text-sm">
                {invites.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <Trans
                          i18nKey="attendeeCount"
                          defaults="{count, plural, =0 {No attendees} one {1 attendee} other {# attendees}}"
                          values={{ count: invites.length }}
                        />
                      </span>
                    </TooltipTrigger>
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
          {status === "canceled" && (
            <Badge>
              <Trans i18nKey="canceled" defaults="Canceled" />
            </Badge>
          )}
        </div>
        <div className="flex items-center whitespace-nowrap text-sm lg:min-w-40">
          <div>
            <div>
              <FormattedDateTime
                date={start}
                floating={isFloating}
                format="LL"
              />
            </div>
            <div className="mt-1 text-muted-foreground">
              {allDay ? (
                <Trans i18nKey="allDay" defaults="All day" />
              ) : (
                <div className="flex items-center gap-x-1">
                  <FormattedDateTime
                    date={start}
                    floating={isFloating}
                    format="LT"
                  />
                  <span>-</span>
                  <FormattedDateTime
                    date={end}
                    floating={isFloating}
                    format="LT"
                  />
                </div>
              )}
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
        {status !== "canceled" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Icon>
                  <MoreHorizontalIcon />
                </Icon>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  cancelEvent.executeAsync({
                    eventId,
                  })
                }
              >
                <Icon>
                  <XIcon />
                </Icon>
                <Trans i18nKey="cancelEvent" defaults="Cancel Event" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
