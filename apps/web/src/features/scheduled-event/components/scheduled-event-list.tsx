import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { ScheduledEventStatusBadge } from "@/features/scheduled-event/components/scheduled-event-status-badge";
import type { Status } from "@/features/scheduled-event/schema";
import { TimeRangeDisplay } from "@/features/timezone/timezone-display";

export const ScheduledEventList = StackedList;

export function ScheduledEventListItem({
  eventId,
  title,
  start,
  end,
  status,
  allDay,
  invites,
}: {
  eventId: string;
  title: string;
  start: Date;
  end: Date;
  status: Status;
  allDay: boolean;
  invites: { id: string; inviteeName: string; inviteeImage?: string }[];
}) {
  return (
    <StackedListItem key={eventId}>
      <div className="flex flex-1 flex-col gap-y-1 lg:flex-row-reverse lg:justify-end lg:gap-x-4">
        <div className="flex items-center gap-4 text-sm">
          {/* <Link href={`/e/${eventId}`} className="font-medium hover:underline"> */}
          {title}
          {/* </Link> */}
          <div>
            <ScheduledEventStatusBadge status={status} />
          </div>
        </div>
        <div className="text-muted-foreground flex items-center whitespace-nowrap text-sm lg:min-w-40">
          {allDay ? (
            <Trans i18nKey="allDay" defaults="All day" />
          ) : (
            <div className="flex items-center gap-x-1">
              <TimeRangeDisplay start={start} end={end} />
            </div>
          )}
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
        {/* <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Icon>
              <CopyIcon />
            </Icon>
          </Button>
        </div> */}
      </div>
    </StackedListItem>
  );
}
