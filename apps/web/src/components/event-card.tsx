"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { MapPinIcon } from "lucide-react";

import PollSubheader from "@/components/poll/poll-subheader";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { usePoll } from "@/contexts/poll";

export function EventCard() {
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
