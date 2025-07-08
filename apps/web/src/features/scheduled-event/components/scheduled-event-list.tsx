"use client";

import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { StackedList } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { useSafeAction } from "@/features/safe-action/client";
import { FormattedDateTime } from "@/features/timezone/client/formatted-date-time";
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
import { MoreHorizontalIcon, XIcon } from "lucide-react";
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
}: {
  eventId: string;
  title: string;
  status: ScheduledEventStatus;
  start: Date;
  end: Date;
  allDay: boolean;
  invites: { id: string; inviteeName: string; inviteeImage?: string }[];
  floating: boolean;
}) {
  const cancelEvent = useSafeAction(cancelEventAction);
  return (
    <div className="flex w-full gap-6">
      <div className="flex flex-1 flex-col gap-y-1 lg:flex-row-reverse lg:justify-end lg:gap-x-4">
        <div className="flex items-center gap-4 text-sm">
          <div>{title}</div>
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
        <div className="hidden sm:block">
          <ParticipantAvatarBar
            participants={invites.map((invite) => ({
              id: invite.id,
              name: invite.inviteeName,
              image: invite.inviteeImage ?? undefined,
            }))}
            max={5}
          />
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
