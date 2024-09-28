"use client";

import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  BarChart2Icon,
  CalendarIcon,
  CheckIcon,
  Link2Icon,
  User2Icon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCopyToClipboard } from "react-use";

import {
  GridCard,
  GridCardFooter,
  GridCardHeader,
} from "@/components/grid-card";
import { GroupPollIcon } from "@/components/group-poll-icon";
import { Pill, PillList } from "@/components/pill";
import { PollStatusLabel } from "@/components/poll-status";
import { Trans } from "@/components/trans";
import { useLocalizeTime } from "@/utils/dayjs";
import { getRange } from "@/utils/get-range";

function CopyLinkButton({ link, ...forwardProps }: { link: string }) {
  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = React.useState(false);

  return (
    <Tooltip open={isCopied ? true : undefined}>
      <TooltipTrigger asChild>
        <Button
          {...forwardProps}
          variant="ghost"
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
}: {
  pollId: string;
  title: string;
  inviteLink: string;
  responseCount: number;
  dateStart: Date;
  dateEnd: Date;
  status: PollStatus;
}) {
  const localizeTime = useLocalizeTime();

  return (
    <GridCard key={pollId}>
      <GridCardHeader>
        <div>
          <GroupPollIcon size="xs" />
        </div>
        <h3 className="truncate font-medium">
          <Link
            className="hover:underline focus:text-gray-900"
            href={`/poll/${pollId}`}
          >
            {title}
          </Link>
        </h3>
      </GridCardHeader>
      <PillList>
        <Pill>
          <PollStatusLabel status={status} />
        </Pill>
        <Pill>
          <Icon>
            <CalendarIcon />
          </Icon>
          {getRange(
            localizeTime(dateStart).toDate(),
            localizeTime(dateEnd).toDate(),
          )}
        </Pill>
        <Pill>
          <Icon>
            <User2Icon />
          </Icon>
          <Trans defaults="{count, number}" values={{ count: responseCount }} />
        </Pill>
      </PillList>
      <GridCardFooter>
        <div className="flex justify-end gap-1">
          <CopyLinkButton link={inviteLink} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" asChild>
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
        </div>
      </GridCardFooter>
    </GridCard>
  );
}
