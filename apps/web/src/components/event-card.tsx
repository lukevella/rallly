"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Card, CardContent, CardDescription } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { CircleStopIcon, DotIcon, MapPinIcon } from "lucide-react";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import VoteIcon from "@/components/poll/vote-icon";
import { PollStatusBadge } from "@/components/poll-status";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { usePoll } from "@/contexts/poll";
import { Trans, useTranslation } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";

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

export function EventCard() {
  const poll = usePoll();
  const { t } = useTranslation();
  return (
    <>
      <Card>
        <RandomGradientBar />
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:justify-between">
            <div>
              <h1 data-testid="poll-title" className="font-semibold text-lg">
                {poll.title}
              </h1>
              <CardDescription>
                <span className="flex items-center gap-0.5 whitespace-nowrap text-muted-foreground text-sm">
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
              </CardDescription>
            </div>
            {poll.status !== "open" ? (
              <PollStatusBadge status={poll.status} />
            ) : null}
          </div>
          {poll.description ? (
            <p className="min-w-0 whitespace-pre-wrap text-pretty text-sm leading-relaxed">
              <TruncatedLinkify>{poll.description}</TruncatedLinkify>
            </p>
          ) : null}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <IconGuide />
            {poll.location ? (
              <p className="truncate whitespace-nowrap text-muted-foreground text-sm">
                <Icon>
                  <MapPinIcon className="-mt-0.5 mr-1.5 inline-block" />
                </Icon>
                <TruncatedLinkify>{poll.location}</TruncatedLinkify>
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
      {poll.status === "closed" ? (
        <Alert>
          <CircleStopIcon />
          <AlertTitle>
            <Trans i18nKey="pollStatusClosed" defaults="Closed" />
          </AlertTitle>
          <AlertDescription>
            <p>
              <Trans
                i18nKey="pollStatusClosedDescription"
                defaults="Votes cannot be submitted or edited at this time"
              />
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
