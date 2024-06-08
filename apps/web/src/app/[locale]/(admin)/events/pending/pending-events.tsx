"use client";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Checkbox } from "@rallly/ui/checkbox";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import dayjs from "dayjs";
import {
  CalendarPlusIcon,
  CopyIcon,
  MoreHorizontalIcon,
  SquareArrowOutUpRightIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { trpc } from "@/app/providers";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";

function CopyLinkButton({ pollId }: { pollId: string }) {
  const [state, copy] = useCopyToClipboard();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
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
      <ol className="divide-y">
        {data.map((poll) => (
          <li
            key={poll.id}
            className="group relative flex justify-between gap-4 p-3 focus-within:bg-gray-50"
            onClick={() => {
              setSelectedId(poll.id);
            }}
          >
            <Link className="absolute inset-0" href={`/poll/${poll.id}`} />
            <div className="flex items-center gap-4">
              {/* <Checkbox
                className="relative z-20 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              /> */}
              <GroupPollIcon size="sm" />
              <div className="min-w-0 truncate text-sm font-medium">
                {poll.title}
              </div>
            </div>
            <div className="flex items-center gap-6 px-2.5">
              <div className="flex items-center gap-x-1.5 text-sm">
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
              <div className="flex gap-x-2.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
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
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
