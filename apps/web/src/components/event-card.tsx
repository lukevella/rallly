import { MapPinIcon, MousePointerClickIcon, TextIcon } from "@rallly/icons";
import dayjs from "dayjs";
import { useTranslation } from "next-i18next";

import { Card } from "@/components/card";
import { DateIcon } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import { PollStatusBadge } from "@/components/poll-status";
import { TextSummary } from "@/components/text-summary";
import { Trans } from "@/components/trans";
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

  const status = poll?.event ? "closed" : poll?.closed ? "paused" : "live";

  if (!poll) {
    return null;
  }

  return (
    <Card fullWidthOnMobile={false}>
      <div className="divide-y">
        <div
          className="h-2"
          style={{ background: generateGradient(poll.id) }}
        />
        <div className="bg-pattern p-4 sm:flex sm:flex-row-reverse sm:justify-between sm:px-6">
          <div className="mb-2">
            <PollStatusBadge status={status} />
          </div>
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
                {poll.event ? (
                  <div className="text-muted-foreground text-sm">
                    {poll.event.duration === 0
                      ? adjustTimeZone(poll.event.start, !poll.timeZone).format(
                          "LL",
                        )
                      : `${adjustTimeZone(
                          poll.event.start,
                          !poll.timeZone,
                        ).format("LLL")} - ${adjustTimeZone(
                          dayjs(poll.event.start).add(
                            poll.event.duration,
                            "minutes",
                          ),
                          !poll.timeZone,
                        ).format("LT")}`}
                  </div>
                ) : null}
                <h1
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                  data-testid="poll-title"
                >
                  {preventWidows(poll.title)}
                </h1>
                {!poll.event ? (
                  <PollSubheader />
                ) : (
                  <div className="mt-4">
                    <div className="text-muted-foreground mb-2 text-sm">
                      <Trans
                        i18nKey="attendeeCount"
                        defaults="{count, plural, one {# attendee} other {# attendees}}"
                        values={{ count: attendees.length }}
                      />
                    </div>
                    <ParticipantAvatarBar participants={attendees} max={10} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4 p-4 sm:px-6">
          {poll.description ? (
            <div className="flex gap-4">
              <TextIcon className="h-4 w-4 shrink-0 translate-y-1" />
              <div className="border-primary whitespace-pre-line leading-relaxed">
                <TruncatedLinkify>
                  <TextSummary text={preventWidows(poll.description)} />
                </TruncatedLinkify>
              </div>
            </div>
          ) : null}
          {poll.location ? (
            <div className="flex gap-4">
              <MapPinIcon className="h-4 w-4 translate-y-1" />
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </div>
          ) : null}
          <div className="flex gap-4">
            <MousePointerClickIcon className="h-4 w-4 shrink-0 translate-y-0.5" />
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
      </div>
    </Card>
  );
};
