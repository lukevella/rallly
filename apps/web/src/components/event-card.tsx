import { Card, CardContent, CardHeader } from "@rallly/ui/card";
import dayjs from "dayjs";
import { MapPinIcon, MousePointerClickIcon, TextIcon } from "lucide-react";
import { useTranslation } from "next-i18next";

import { DateIcon } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import { PollStatusBadge } from "@/components/poll-status";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/components/trans";
import { IfParticipantsVisible } from "@/components/visibility";
import { usePoll } from "@/contexts/poll";
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
    <Card>
      <RandomGradientBar />
      <CardHeader className="grid gap-4 sm:flex sm:justify-between">
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
                className="mb-1 text-lg font-semibold tracking-tight"
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
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.description ? (
          <div className="flex gap-4">
            <TextIcon className="text-muted-foreground size-4 shrink-0 translate-y-1" />
            <div className="text-sm leading-relaxed">
              <TruncatedLinkify>{poll.description}</TruncatedLinkify>
            </div>
          </div>
        ) : null}
        {poll.location ? (
          <div className="flex gap-4 text-sm">
            <MapPinIcon className="text-muted-foreground size-4 translate-y-1" />
            <TruncatedLinkify>{poll.location}</TruncatedLinkify>
          </div>
        ) : null}
        <div className="flex gap-4">
          <MousePointerClickIcon className="text-muted-foreground size-4 shrink-0 translate-y-0.5" />
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
      </CardContent>
    </Card>
  );
};
