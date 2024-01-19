import dayjs from "dayjs";
import { MapPinIcon, MousePointerClickIcon, TextIcon } from "lucide-react";
import { useTranslation } from "next-i18next";

import { Card } from "@/components/card";
import { DateIcon } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import { PollStatusBadge } from "@/components/poll-status";
import { Trans } from "@/components/trans";
import { IfParticipantsVisible } from "@/components/visibility";
import { usePoll } from "@/contexts/poll";
import { generateGradient } from "@/utils/color-hash";
import { useDayjs } from "@/utils/dayjs";
import { preventWidows } from "@/utils/prevent-widows";

import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import VoteIcon from "./poll/vote-icon";

export const EventCard = () => {
  const { t } = useTranslation();
  const poll = usePoll();

  const { participants } = useParticipants();

  const { adjustTimeZone } = useDayjs();

  const attendees = participants.filter((participant) =>
    participant.votes.some(
      (vote) =>
        vote.optionId === poll?.event?.optionId &&
        (vote.type === "yes" || vote.type === "ifNeedBe"),
    ),
  );

  if (!poll) {
    return null;
  }

  return (
    <Card className="overflow-visible" fullWidthOnMobile={false}>
      <div
        className="-mx-px -mt-px h-2 rounded-t-md"
        style={{ background: generateGradient(poll.id) }}
      />
      <div className="bg-pattern grid gap-4 p-4 sm:flex sm:justify-between sm:px-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 sm:gap-6">
            {poll.event ? (
              <div>
                <DateIcon
                  date={adjustTimeZone(poll.event.start, !poll.timeZone)}
                />
              </div>
            ) : null}
            <div>
              <h1
                className="mb-1 text-xl font-bold tracking-tight"
                data-testid="poll-title"
              >
                {preventWidows(poll.title)}
              </h1>
              {poll.event ? (
                <div className="text-muted-foreground text-sm">
                  {poll.event.duration === 0
                    ? adjustTimeZone(poll.event.start, !poll.timeZone).format(
                        "LL",
                      )
                    : `${adjustTimeZone(
                        poll.event.start,
                        !poll.timeZone,
                      ).format("LL LT")} - ${adjustTimeZone(
                        dayjs(poll.event.start).add(
                          poll.event.duration,
                          "minutes",
                        ),
                        !poll.timeZone,
                      ).format("LT")}`}
                </div>
              ) : null}
              {!poll.event ? (
                <PollSubheader />
              ) : (
                <div className="mt-4 space-y-2">
                  <div className="text-muted-foreground text-sm">
                    <Trans
                      i18nKey="attendeeCount"
                      defaults="{count, plural, one {# attendee} other {# attendees}}"
                      values={{ count: attendees.length }}
                    />
                  </div>
                  <IfParticipantsVisible>
                    <ParticipantAvatarBar participants={attendees} max={10} />
                  </IfParticipantsVisible>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <PollStatusBadge status={poll.status} />
        </div>
      </div>
      <div className="space-y-4 p-4 sm:px-6">
        {poll.description ? (
          <div className="flex gap-4">
            <TextIcon className="text-muted-foreground h-4 w-4 shrink-0 translate-y-1" />
            <div className="whitespace-pre-line">
              <TruncatedLinkify>{poll.description}</TruncatedLinkify>
            </div>
          </div>
        ) : null}
        {poll.location ? (
          <div className="flex gap-4">
            <MapPinIcon className="text-muted-foreground h-4 w-4 translate-y-1" />
            <TruncatedLinkify>{poll.location}</TruncatedLinkify>
          </div>
        ) : null}
        <div className="flex gap-4">
          <MousePointerClickIcon className="text-muted-foreground h-4 w-4 shrink-0 translate-y-0.5" />
          <div>
            <div className="flex gap-2.5">
              <span className="inline-flex items-center space-x-1">
                <VoteIcon type="yes" />
                <span className="text-sm">{t("yes")}</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <VoteIcon type="ifNeedBe" />
                <span className="text-sm">{t("ifNeedBe")}</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <VoteIcon type="no" />
                <span className="text-sm">{t("no")}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
