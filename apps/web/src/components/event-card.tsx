"use client";
import { Card, CardContent } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { InfoCard } from "@rallly/ui/info-card";
import dayjs from "dayjs";
import { DotIcon } from "lucide-react";

import { useTranslation } from "@/app/i18n/client";
import { ScheduledEvent } from "@/components/poll/scheduled-event";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import VoteIcon from "@/components/poll/vote-icon";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

function IconGuide() {
  return (
    <ul className="flex items-center gap-x-3 whitespace-nowrap text-sm">
      <li className="flex items-center gap-1.5">
        <VoteIcon type="yes" />
        <Trans i18nKey="yes" />
      </li>
      <li className="flex items-center gap-1.5">
        <VoteIcon type="ifNeedBe" />
        <Trans i18nKey="ifNeedBe" />
      </li>
      <li className="flex items-center gap-1.5">
        <VoteIcon type="no" />
        <Trans i18nKey="no" />
      </li>
    </ul>
  );
}

export function EventCard({ children }: { children?: React.ReactNode }) {
  const poll = usePoll();
  const { t } = useTranslation();
  return (
    <div>
      <div className="space-y-4">
        <Card>
          <RandomGradientBar seed={poll.id} />
          <CardContent>
            <h1
              data-testid="poll-title"
              className="mb-2 text-pretty text-xl font-semibold"
            >
              {poll.title}
            </h1>
            <p>
              <span className="flex items-center gap-0.5 whitespace-nowrap text-sm text-gray-500">
                <span>
                  <Trans
                    i18nKey="createdBy"
                    values={{
                      name: poll.user?.name ?? t("guest"),
                    }}
                    components={{
                      b: <span />,
                    }}
                  />
                </span>
                <Icon>
                  <DotIcon />
                </Icon>
                <span className="whitespace-nowrap">
                  <Trans
                    i18nKey="createdTime"
                    values={{ relativeTime: dayjs(poll.createdAt).fromNow() }}
                  />
                </span>
              </span>
            </p>
            {poll.description ? (
              <p className="mt-6 whitespace-pre-wrap text-pretty text-sm">
                <TruncatedLinkify>{poll.description}</TruncatedLinkify>
              </p>
            ) : null}
          </CardContent>
        </Card>
        {/* <InfoCard>
          <InfoCardHeader>Vote Legend</InfoCardHeader>
          <InfoCardBody>
            <IconGuide />
          </InfoCardBody>
        </InfoCard> */}

        {poll.location ? (
          <InfoCard title="Location">
            <p className="text-muted-foregroun truncate whitespace-nowrap text-sm">
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </p>
          </InfoCard>
        ) : null}
        <ScheduledEvent />
      </div>
      {children}
    </div>
  );
}
