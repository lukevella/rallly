import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { StackedList } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { ScheduledEventStatusBadge } from "@/features/scheduled-event/components/scheduled-event-status-badge";
import type { Status } from "@/features/scheduled-event/schema";
import { FormattedDateTime } from "@/features/timezone/client/formatted-date-time";

export const ScheduledEventList = StackedList;

export function ScheduledEventListItem({
  title,
  start,
  end,
  status,
  allDay,
  invites,
  floating: isFloating,
}: {
  eventId: string;
  title: string;
  start: Date;
  end: Date;
  status: Status;
  allDay: boolean;
  invites: { id: string; inviteeName: string; inviteeImage?: string }[];
  floating: boolean;
}) {
  return (
    <div className="flex w-full gap-6">
      <div className="flex flex-1 flex-col gap-y-1 lg:flex-row-reverse lg:justify-end lg:gap-x-4">
        <div className="flex items-center gap-4 text-sm">
          <div>{title}</div>
          <div>
            <ScheduledEventStatusBadge status={status} />
          </div>
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
            <div className="text-muted-foreground mt-1">
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
      </div>
    </div>
  );
}
