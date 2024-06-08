"use client";
import { Button } from "@rallly/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import dayjs from "dayjs";
import {
  CalendarPlusIcon,
  CopyIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  SquareArrowOutUpRightIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import {
  GroupPollIcon,
  GroupPollIconFrame,
} from "@/app/[locale]/(admin)/app-card";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { trpc } from "@/app/providers";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";

function CopyLinkButton({ pollId }: { pollId: string }) {
  const [state, copy] = useCopyToClipboard();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          className="relative z-20"
          onClick={(e) => {
            e.stopPropagation();
            copy(`${window.location.origin}/invite/${pollId}`);
          }}
          variant="ghost"
        >
          <Icon>
            <CopyIcon />
          </Icon>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Trans i18nKey="copyLink" defaults="Copy Link" />
      </TooltipContent>
    </Tooltip>
  );
}

function GroupPoll({ pollId }: { pollId: string }) {
  const { data: poll } = trpc.polls.get.useQuery({ urlId: pollId });

  if (!poll) {
    return <Spinner />;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-50">
        <RandomGradientBar seed={poll.id} />
        <CardContent>
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
            <div>
              <CardTitle data-testid="poll-title" className="text-lg">
                {poll.title}
              </CardTitle>
              <CardDescription>
                <span className="flex items-center gap-0.5 whitespace-nowrap text-sm text-gray-500">
                  <span className="whitespace-nowrap">
                    <Trans
                      i18nKey="createdTime"
                      values={{ relativeTime: dayjs(poll.createdAt).fromNow() }}
                    />
                  </span>
                </span>
              </CardDescription>
            </div>
          </div>
          {poll.location ? (
            <p className="text-muted-foregroun mt-4 text-sm">
              <Icon>
                <MapPinIcon className="-mt-0.5 mr-2 inline-block" />
              </Icon>
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </p>
          ) : null}
        </CardContent>
      </Card>
      {poll.description ? (
        <Card>
          <CardContent>
            <p className="text-sm leading-relaxed">{poll.description}</p>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent>
          <h3 className="text-muted-background text-sm">Results</h3>
        </CardContent>
      </Card>
    </div>
  );
}

export function PendingEvents() {
  const { data } = trpc.events.listPending.useQuery();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  if (!data) {
    return <Spinner />;
  }
  if (data?.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>No pending events</EmptyStateTitle>
        <EmptyStateDescription>
          You do not have any events pending
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <Card>
      <ol className="divide-y divide-gray-100">
        {data.map((poll) => (
          <li
            key={poll.id}
            className="relative flex flex-col gap-8 p-4 focus-within:bg-gray-50 "
            onClick={() => {
              setSelectedId(poll.id);
            }}
          >
            <div className="flex items-center gap-4">
              <GroupPollIcon size="sm" />
              <div className="flex min-w-0 grow items-center gap-x-4">
                {/* <Checkbox
            className="relative z-20 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          /> */}
                <div className="min-w-0">
                  <div className="truncate">
                    <Link
                      className="font-medium hover:underline focus:underline"
                      href={`/poll/${poll.id}`}
                    >
                      {poll.title}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="flex gap-x-2.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="relative z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      variant="ghost"
                      asChild
                    >
                      <Link href={`/invite/${poll.id}`} target="_blank">
                        <Icon>
                          <SquareArrowOutUpRightIcon />
                        </Icon>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Trans i18nKey="preview" defaults="Preview" />
                  </TooltipContent>
                </Tooltip>
                <CopyLinkButton pollId={poll.id} />
                <Button
                  size="sm"
                  className="relative z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  variant="ghost"
                >
                  <Icon>
                    <MoreHorizontalIcon />
                  </Icon>
                </Button>
              </div>
              {/* <div className="flex flex-col items-end space-y-1">
          <div className="flex items-center gap-x-2 text-xs font-medium">
            <Icon>
              <UserIcon />
            </Icon>
            {poll.participants.length}
          </div>
          <div className="text-muted-foreground text-sm">
            <Trans
              i18nKey="createdTime"
              values={{ relativeTime: dayjs(poll.createdAt).fromNow() }}
            />
          </div>
        </div> */}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
