"use client";
import { Badge } from "@rallly/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { BarChart2Icon } from "lucide-react";
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
import DesktopPoll from "@/components/poll/desktop-poll";
import { VotingForm } from "@/components/poll/voting-form";
import { PollStatusBadge } from "@/components/poll-status";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { usePoll } from "@/contexts/poll";

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
      <VotingForm>
        <DesktopPoll />
      </VotingForm>
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
          <VotingForm>
            <DesktopPoll />
          </VotingForm>
          <Discussion />
        </div>
      </PageContent>
    </PageContainer>
  );
}
