import { CalendarPlusIcon, CheckCircleIcon, MailPlusIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import dayjs from "dayjs";

import { Card } from "@/components/card";
import { DateIconInner } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import { useOptions } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

export const EventCard = () => {
  const poll = usePoll();
  const { options } = useOptions();

  const { participants } = useParticipants();
  if (!poll.eventId) {
    return null;
  }
  return (
    <Card>
      <div>
        <div className="flex items-center justify-between bg-green-500 p-2 pr-4 text-sm  font-semibold text-green-50 shadow-sm">
          <span className="inline-flex items-center gap-x-2 ">
            <CheckCircleIcon className="h-5 w-5" />
            <div className="font-medium">
              <Trans i18nKey="dateSelectedMessage" defaults="Booked!" />
            </div>
          </span>
        </div>
      </div>
      <div className="bg-pattern px-3 pb-5 pt-3">
        <div className="flex-col-rev flex justify-between">
          <div className="flex gap-x-4">
            <div>
              <DateIconInner
                dow={selectedOption.dow}
                month={selectedOption.month}
                day={selectedOption.day}
              />
            </div>
            <div>
              <div className="font-semibold">{poll.title}</div>
              <div className="text-muted-foreground text-sm">
                {dayjs(selectedOption.date).format(
                  selectedOption.type === "date" ? "LL" : "LLL",
                )}
              </div>
              <div className="mt-4">
                <div className="text-muted-foreground mb-1 text-xs">
                  <Trans
                    i18nKey="participantCount"
                    values={{ count: participants.length }}
                  />
                </div>
                <ParticipantAvatarBar participants={participants} max={8} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-x-2 border-t bg-gray-50 p-3">
        <Button icon={MailPlusIcon} className="">
          <Trans i18nKey="sendCalendarInvite" defaults="Send Calender Invite" />
        </Button>
        <Button icon={CalendarPlusIcon}>
          <Trans i18nKey="addToCalendar" defaults="Add to Calendar" />
        </Button>
      </div>
    </Card>
  );
};
