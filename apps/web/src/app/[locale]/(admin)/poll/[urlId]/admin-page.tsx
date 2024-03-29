"use client";
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
import { ArrowLeftIcon, BarChart2Icon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { useTranslation } from "@/app/i18n/client";
import Discussion from "@/components/discussion";
import { useParticipants } from "@/components/participants-provider";
import UserAvatar from "@/components/poll/participant-avatar";
import { PollStatusBadge } from "@/components/poll-status";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { usePoll } from "@/contexts/poll";

import { GuestPollAlert } from "./guest-poll-alert";

function ParticipantsCard() {
  const { participants } = useParticipants();
  const { t } = useTranslation("app");
  if (participants.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon>
          <BarChart2Icon />
        </EmptyStateIcon>
        <EmptyStateTitle>No participants yet</EmptyStateTitle>
        <EmptyStateDescription>
          Share your invite link with your participants
        </EmptyStateDescription>
      </EmptyState>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans t={t} i18nKey="participants" />
          <Badge>{participants.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-start gap-2.5">
              <UserAvatar name={participant.name} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {participant.name}
                </div>
                <div className="text-muted-foreground truncate text-sm lowercase">
                  {participant.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard() {
  const poll = usePoll();
  const { t } = useTranslation("app");

  return (
    <Card>
      <RandomGradientBar seed={poll.id} />
      <CardHeader>
        <CardTitle className="text-lg">
          {poll.title}
          <Icon size="lg">
            <BarChart2Icon />
          </Icon>
        </CardTitle>
        <CardDescription>
          <PollStatusBadge status={poll.status} />
        </CardDescription>
      </CardHeader>
      <dl className="grid divide-y">
        <CardContent className="flex flex-col gap-y-1 lg:flex-row">
          <dt className="text-muted-foreground text-sm lg:w-16 lg:shrink-0">
            What
          </dt>
          <dd className="grow text-sm leading-relaxed">{poll.description}</dd>
        </CardContent>
        <CardContent className="flex flex-col gap-y-1 lg:flex-row">
          <dt className="text-muted-foreground text-sm lg:w-16">Where</dt>
          <dd className="grow text-sm font-medium">{poll.location}</dd>
        </CardContent>
      </dl>
    </Card>
  );
}

export function AdminPage() {
  return (
    <PageContainer>
      <PageContent>
        <div className="space-y-6">
          <EventCard />
          <ParticipantsCard />
          <Discussion />
        </div>
      </PageContent>
    </PageContainer>
  );
}
