"use client";

import { cn } from "@rallly/ui";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowUpRightIcon,
  CheckCircleIcon,
  LinkIcon,
  MapPinIcon,
  PauseCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import Discussion from "@/components/discussion";
import PollSubheader from "@/components/poll/poll-subheader";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { useTouchBeacon } from "@/components/poll/use-touch-beacon";
import { VotingForm } from "@/components/poll/voting-form";
import { PollViz } from "@/components/poll-viz";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

function StatusInfo() {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  if (poll.event) {
    return (
      <Alert icon={CheckCircleIcon}>
        <AlertTitle>
          <Trans i18nKey="pollStatusFinalized" />
        </AlertTitle>
        <AlertDescription>
          <Trans
            i18nKey="pollStatusFinalizedDescription"
            defaults="A final date has been selected"
          />
        </AlertDescription>
        <div className="mt-4">
          <Badge>{adjustTimeZone(poll.event.start).format("LLL")}</Badge>
        </div>
      </Alert>
    );
  }

  if (poll.status === "paused") {
    return (
      <Alert icon={PauseCircleIcon}>
        <AlertTitle>
          <Trans i18nKey="pollStatusPaused" />
        </AlertTitle>
        <AlertDescription>
          <Trans
            i18nKey="pollStatusPausedDescription"
            defaults="The poll has been paused. Votes cannot be submitted or edited."
          />
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

function EventCard() {
  const poll = usePoll();
  return (
    <Card>
      <RandomGradientBar seed={poll.id} />
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{poll.title}</CardTitle>
            {poll.location ? (
              <CardDescription className="flex items-center gap-x-1">
                <Icon>
                  <MapPinIcon />
                </Icon>
                <TruncatedLinkify>{poll.location}</TruncatedLinkify>
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.description ? (
          <p className="text-sm">
            <TruncatedLinkify>{poll.description}</TruncatedLinkify>
          </p>
        ) : null}
        <PollSubheader />
      </CardContent>
    </Card>
  );
}

export function CopyInviteLinkButton({ className }: { className: string }) {
  const [didCopy, setDidCopy] = React.useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();
  const poll = usePoll();
  const inviteLinkWithoutProtocol = poll.inviteLink.replace(/^https?:\/\//, "");

  React.useEffect(() => {
    if (state.error) {
      console.error(`Unable to copy value: ${state.error.message}`);
    }
  }, [state]);

  return (
    <Button
      className={cn("min-w-0", className)}
      onClick={() => {
        copyToClipboard(poll.inviteLink);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
    >
      {didCopy ? (
        <Trans i18nKey="copied" />
      ) : (
        <>
          <Icon>
            <LinkIcon />
          </Icon>
          <span className="min-w-0 truncate">{inviteLinkWithoutProtocol}</span>
        </>
      )}
    </Button>
  );
}

export function ShareCard() {
  const poll = usePoll();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans i18nKey="share" />
        </CardTitle>
        <CardDescription>
          <Trans i18nKey="inviteParticipantsDescription" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <div className="flex gap-x-2.5">
            <div className="grow">
              <CopyInviteLinkButton className="w-full" />
            </div>
            <Button asChild>
              <Link target="_blank" href={poll.inviteLink}>
                <Icon>
                  <ArrowUpRightIcon />
                </Icon>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminPage() {
  const poll = usePoll();
  useTouchBeacon(poll.id);
  return (
    <div className="space-y-4 lg:space-y-6">
      <ShareCard />
      <hr />
      <EventCard />
      <StatusInfo />
      <VotingForm>
        <PollViz />
      </VotingForm>
      <Discussion />
    </div>
  );
}
