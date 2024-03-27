"use client";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { BarChart2Icon, MoreHorizontal } from "lucide-react";
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
import { InviteDialog } from "@/components/invite-dialog";
import { useParticipants } from "@/components/participants-provider";
import UserAvatar from "@/components/poll/participant-avatar";
import { PollStatusBadge, PollStatusLabel } from "@/components/poll-status";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { usePoll } from "@/contexts/poll";

import { GuestPollAlert } from "./guest-poll-alert";

function ParticipantsCard() {
  const { participants } = useParticipants();
  const { t } = useTranslation("app");
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans t={t} i18nKey="participants" />
          <Badge>{participants.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              <BarChart2Icon />
            </EmptyStateIcon>
            <EmptyStateTitle>No participants yet</EmptyStateTitle>
            <EmptyStateDescription>
              Share your invite link with your participants
            </EmptyStateDescription>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-start gap-2">
                <UserAvatar name={participant.name} />
                <div>
                  <div className="text-sm font-medium">{participant.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {participant.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventCard() {
  const poll = usePoll();
  const { t } = useTranslation("app");

  return (
    <Card>
      <RandomGradientBar seed={poll.title} />
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div>
            <CardTitle>{poll.title}</CardTitle>
          </div>
          <div className="flex items-center">
            <InviteDialog />
          </div>
        </div>
        <dl className="grid gap-2">
          <dt className="text-muted-foreground col-span-1 text-sm">
            Description
          </dt>
          <dd className="mb-1 text-sm">{poll.description}</dd>
          <dt className="text-muted-foreground col-span-1 text-sm">Location</dt>
          <dd className="mb-1 text-sm font-medium">{poll.location}</dd>
          <dt className="text-muted-foreground col-span-1 text-sm">Status</dt>
          <dd className="mb-1 text-sm font-medium">
            <PollStatusLabel status={poll.status} />
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
}

export function AdminPage() {
  return (
    <PageContainer>
      <PageContent>
        <div className={cn("space-y-6")}>
          <GuestPollAlert />
          <EventCard />
          <ParticipantsCard />
          <Discussion />
        </div>
      </PageContent>
    </PageContainer>
  );
}
