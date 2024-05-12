"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Card, CardContent, CardDescription, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import { DotIcon, MapPinIcon, PauseIcon } from "lucide-react";

import { useTranslation } from "@/app/i18n/client";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { PollStatusBadge } from "@/components/poll-status";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

export function EventCard() {
  const poll = usePoll();
  const { t } = useTranslation();
  return (
    <>
      <Card className="bg-gray-50">
        <RandomGradientBar seed={poll.id} />
        <CardContent>
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:justify-between">
            <div>
              <CardTitle data-testid="poll-title" className="text-lg">
                {poll.title}
              </CardTitle>
              <CardDescription>
                <span className="flex items-center gap-1 text-sm text-gray-500">
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
            <PollStatusBadge status={poll.status} />
          </div>
          {poll.description ? (
            <p className="mt-4 min-w-0 text-wrap text-sm leading-relaxed">
              <TruncatedLinkify>{poll.description}</TruncatedLinkify>
            </p>
          ) : null}
          {poll.location ? (
            <ul className="text-muted-foreground mt-4 flex flex-col gap-x-4 gap-y-2.5 whitespace-nowrap text-sm">
              <li className="flex items-center gap-x-2.5">
                <Icon>
                  <MapPinIcon />
                </Icon>
                <TruncatedLinkify>{poll.location}</TruncatedLinkify>
              </li>
            </ul>
          ) : null}
        </CardContent>
      </Card>
      {poll.status === "paused" ? (
        <Alert icon={PauseIcon}>
          <AlertTitle>
            <Trans i18nKey="pollStatusPaused" />
          </AlertTitle>
          <AlertDescription>
            <Trans
              i18nKey="pollStatusPausedDescription"
              defaults="Votes cannot be submitted or edited at this time"
            />
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
