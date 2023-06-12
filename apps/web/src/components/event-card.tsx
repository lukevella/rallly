import { MapPinIcon, MenuIcon, MousePointerClickIcon } from "@rallly/icons";
import { useTranslation } from "next-i18next";

import { Card } from "@/components/card";
import { DateIcon } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import { PollStatusBadge } from "@/components/poll-status";
import { TextSummary } from "@/components/text-summary";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useDateFormatter } from "@/contexts/time-preferences";
import { generateGradient } from "@/utils/color-hash";
import { preventWidows } from "@/utils/prevent-widows";

import PollSubheader from "./poll/poll-subheader";
import TruncatedLinkify from "./poll/truncated-linkify";
import VoteIcon from "./poll/vote-icon";

export const EventCard = () => {
  const { t } = useTranslation();
  const poll = usePoll();

  const { options } = poll;

  const selectedOptionIndex = options.findIndex(
    (o) => o.id === poll.selectedOptionId,
  );
  const selectedOption = options[selectedOptionIndex];

  const { participants } = useParticipants();

  const dateFormatter = useDateFormatter();
  const attendees = participants.filter((participant) =>
    participant.votes.some(
      (vote) =>
        vote.optionId === poll.selectedOptionId &&
        (vote.type === "yes" || vote.type === "ifNeedBe"),
    ),
  );

  const status = selectedOption ? "closed" : poll.closed ? "paused" : "live";

  return (
    <Card fullWidthOnMobile={false}>
      <div className="divide-y text-gray-600">
        <div
          className="h-2"
          style={{ background: generateGradient(poll.id) }}
        />
        <div className="bg-pattern p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 sm:gap-6">
              {selectedOption ? (
                <div>
                  <DateIcon date={dateFormatter(selectedOption.start)} />
                </div>
              ) : null}
              <div>
                {selectedOption ? (
                  <div className="text-muted-foreground text-sm">
                    {dateFormatter(selectedOption.start).format(
                      selectedOption.duration === 0 ? "LL" : "LLL",
                    )}
                  </div>
                ) : null}
                <h1
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                  data-testid="poll-title"
                >
                  {preventWidows(poll.title)}
                </h1>
                {!selectedOption ? (
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
            <PollStatusBadge status={status} />
          </div>
        </div>
        <div className="space-y-4 p-4 sm:px-5">
          {poll.description ? (
            <div className="flex gap-4">
              <MenuIcon className="h-5 w-5 shrink-0 translate-y-0.5" />
              <div className="border-primary whitespace-pre-line leading-relaxed">
                <TruncatedLinkify>
                  <TextSummary text={preventWidows(poll.description)} />
                </TruncatedLinkify>
              </div>
            </div>
          ) : null}
          {poll.location ? (
            <div className="flex gap-4">
              <MapPinIcon className="h-5 w-5 translate-y-0.5" />
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </div>
          ) : null}
          <div className="flex gap-4">
            <MousePointerClickIcon className="h-5 w-5 shrink-0" />
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
