"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { ArrowUpRightIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import { EventCard } from "@/components/event-card";
import { useTouchBeacon } from "@/components/poll/use-touch-beacon";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

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
    <div className="space-y-4">
      <EventCard />
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
    </div>
  );
}

export function OverviewPage() {
  const poll = usePoll();
  useTouchBeacon(poll.id);
  return (
    <div className="space-y-4 lg:space-y-6">
      <ShareCard />
    </div>
  );
}
