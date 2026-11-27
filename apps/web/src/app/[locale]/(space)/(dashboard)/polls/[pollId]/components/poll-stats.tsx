"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { StarIcon, UsersIcon } from "lucide-react";
import React from "react";
import {
  StatCard,
  StatCardFooter,
  StatCardHeader,
  StatCardLabel,
  StatCardStack,
  StatCardValue,
} from "@/components/stat-card";
import type { VoteType } from "@/features/poll/constants";
import { rankOptionsByPopularity } from "@/features/poll/utils";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { FinalizeDialog } from "./finalize-dialog";
import { optionZone } from "./poll-results";

type Option = { id: string; startTime: Date; duration: number };
type Participant = {
  id: string;
  votes: { optionId: string; type: VoteType }[];
};

function StatIcon({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Two cards: who has responded (with email invite progress and the way to
 * invite more), and the best date so far with a shortcut to finalize it.
 */
export function PollStats({
  responseCount,
  invitedCount,
  respondedInviteCount,
  inviteAction,
  options,
  participants,
  timeZone,
  canFinalize,
}: {
  responseCount: number;
  invitedCount: number;
  respondedInviteCount: number;
  /** Sits in the responses card's top right corner. */
  inviteAction?: React.ReactNode;
  options: Option[];
  participants: Participant[];
  timeZone: string | null;
  /** Not once the poll is scheduled. */
  canFinalize: boolean;
}) {
  return (
    <StatCardStack>
      <StatCard>
        <StatCardHeader>
          <StatCardLabel className="flex min-w-0 items-center gap-2">
            <StatIcon className="bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <UsersIcon />
            </StatIcon>
            <span className="truncate">
              <Trans i18nKey="pollStatsResponses" defaults="Responses" />
            </span>
          </StatCardLabel>
          {inviteAction}
        </StatCardHeader>
        <StatCardFooter className="items-center">
          <StatCardValue>{responseCount}</StatCardValue>
          {invitedCount > 0 ? (
            <span className="flex items-center gap-2 text-muted-foreground text-sm">
              {invitedCount > respondedInviteCount ? (
                <Trans
                  i18nKey="pollStatsAwaiting"
                  defaults="Awaiting {count}"
                  values={{ count: invitedCount - respondedInviteCount }}
                />
              ) : null}
              <ProgressDonut value={respondedInviteCount} max={invitedCount} />
            </span>
          ) : null}
        </StatCardFooter>
      </StatCard>
      <BestDateCard
        options={options}
        participants={participants}
        timeZone={timeZone}
        canFinalize={canFinalize}
      />
    </StatCardStack>
  );
}

/** The date with the most availability, or how many tie for it. */
function BestDateCard({
  options,
  participants,
  timeZone,
  canFinalize,
}: {
  options: Option[];
  participants: Participant[];
  timeZone: string | null;
  canFinalize: boolean;
}) {
  const { formatDateTime } = useDateTime();
  const finalizeDialog = useDialog();
  const ranked = React.useMemo(
    () => rankOptionsByPopularity({ options, participants }),
    [options, participants],
  );
  const availability = (option: (typeof ranked)[number]) =>
    option.votes.yes.length + option.votes.ifNeedBe.length;
  const best = ranked[0] ? availability(ranked[0]) : 0;
  const top = best > 0 ? ranked.filter((o) => availability(o) === best) : [];
  const single = top.length === 1 ? top[0] : undefined;
  const floating = timeZone === null;

  return (
    <StatCard>
      <StatCardHeader>
        <StatCardLabel className="flex min-w-0 items-center gap-2">
          <StatIcon className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <StarIcon />
          </StatIcon>
          <span className="truncate">
            <Trans i18nKey="pollStatsBestDate" defaults="Best date" />
          </span>
        </StatCardLabel>
        {canFinalize && single ? (
          <Button size="sm" onClick={finalizeDialog.trigger}>
            <Trans i18nKey="pollStatsFinalize" defaults="Finalize" />
          </Button>
        ) : null}
      </StatCardHeader>
      <StatCardFooter className="items-end">
        {single ? (
          <StatCardValue className="truncate text-xl">
            {formatDateTime(
              single.startTime,
              "weekdayMonthDayShort",
              optionZone(single, floating),
            )}
            {single.duration > 0 ? (
              <span className="text-muted-foreground">
                {" "}
                {formatDateTime(
                  single.startTime,
                  "time",
                  optionZone(single, floating),
                )}
              </span>
            ) : null}
          </StatCardValue>
        ) : top.length > 1 ? (
          <StatCardValue className="text-xl">
            <Trans
              i18nKey="pollStatsTied"
              defaults="{count} dates tied"
              values={{ count: top.length }}
            />
          </StatCardValue>
        ) : (
          <span className="text-muted-foreground text-sm">
            <Trans
              i18nKey="pollStatsNoBestDate"
              defaults="Shows once people respond"
            />
          </span>
        )}
      </StatCardFooter>
      {canFinalize && single ? (
        <FinalizeDialog {...finalizeDialog.dialogProps} optionId={single.id} />
      ) : null}
    </StatCard>
  );
}

/** How many of the invited have responded, as a ring. */
function ProgressDonut({ value, max }: { value: number; max: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const fraction = max > 0 ? value / max : 0;
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="size-8 shrink-0 -rotate-90"
    >
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        strokeWidth="6"
        className="stroke-foreground/10"
      />
      {fraction > 0 ? (
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="stroke-green-500"
        />
      ) : null}
    </svg>
  );
}
