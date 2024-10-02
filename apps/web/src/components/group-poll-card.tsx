"use client";

import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  BarChart2Icon,
  CalendarSearchIcon,
  CheckIcon,
  Link2Icon,
  MoreHorizontalIcon,
  PauseIcon,
  TrashIcon,
  User2Icon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import { GridCard, GridCardHeader } from "@/components/grid-card";
import { GroupPollIcon } from "@/components/group-poll-icon";
import { Pill, PillList } from "@/components/pill";
import { Trans } from "@/components/trans";
import { useLocalizeTime } from "@/utils/dayjs";
import { getRange } from "@/utils/get-range";

function CopyLinkButton({ link, ...forwardProps }: { link: string }) {
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = React.useState(false);

  return (
    <Tooltip open={isCopied ? true : undefined}>
      <TooltipTrigger onMouseLeave={() => setIsCopied(false)} asChild>
        <Button
          size="sm"
          {...forwardProps}
          onClick={() => {
            copy(link);
            React.startTransition(() => {
              setIsCopied(true);
            });
            setTimeout(() => {
              setIsCopied(false);
            }, 2000);
          }}
        >
          <Icon>
            <Link2Icon />
          </Icon>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isCopied ? (
          <p>
            <CheckIcon className="mr-2 inline-block size-4 text-green-500" />
            <Trans i18nKey="copied" defaults="Copied" />
          </p>
        ) : (
          <Trans i18nKey="copyLink" defaults="Copy link" />
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function GroupPollCard({
  status,
  pollId,
  title,
  inviteLink,
  responseCount,
  dateStart,
  dateEnd,
  timeZone,
}: {
  pollId: string;
  title: string;
  inviteLink: string;
  responseCount: number;
  dateStart: Date;
  dateEnd: Date;
  status: PollStatus;
  timeZone?: string;
}) {
  const localizeTime = useLocalizeTime();

  return (
    <GridCard key={pollId}>
      <GridCardHeader className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div>
            <GroupPollIcon size="xs" />
          </div>
          <h3 className="font-medium">
            <Link className="truncate hover:underline" href={`/poll/${pollId}`}>
              {title}
            </Link>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <CopyLinkButton link={inviteLink} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" asChild>
                <Link href={`/poll/${pollId}`}>
                  <Icon>
                    <BarChart2Icon />
                  </Icon>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Trans i18nKey="viewResults" defaults="View results" />
            </TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Icon>
                  <MoreHorizontalIcon />
                </Icon>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Icon>
                  <PauseIcon />
                </Icon>
                <Trans i18nKey="pause" defaults="Pause" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Icon>
                  <TrashIcon />
                </Icon>
                <Trans i18nKey="deleteMenuItem" defaults="Delete…" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </GridCardHeader>
      <PillList>
        <Pill>
          <Icon>
            <CalendarSearchIcon />
          </Icon>
          {getRange(
            localizeTime(dateStart, !timeZone).toDate(),
            localizeTime(dateEnd, !timeZone).toDate(),
          )}
        </Pill>
        <Pill>
          <Icon>
            <User2Icon />
          </Icon>
          <Trans
            i18nKey="participantCount"
            defaults="{count, plural, one {# participant} other {# participants}}"
            values={{ count: responseCount }}
          />
        </Pill>
      </PillList>
    </GridCard>
  );
}
