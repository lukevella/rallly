"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React from "react";
import {
  StatCard,
  StatCardFooter,
  StatCardHeader,
  StatCardLabel,
  StatCardStack,
  StatCardValue,
} from "@/components/stat-card";
import { usePoll } from "@/features/poll/client";
import type { VoteType } from "@/features/poll/constants";
import {
  pollEventProperties,
  rankOptionsByPopularity,
} from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { FinalizeDialog } from "./finalize-dialog";
import { optionZone } from "./option-date";

type Option = { id: string; startTime: Date; duration: number };
type Participant = {
  id: string;
  votes: { optionId: string; type: VoteType }[];
};

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
          <StatCardLabel className="self-center font-medium text-base text-foreground">
            <Trans i18nKey="pollStatsResponses" defaults="Responses" />
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
              ) : (
                <span className="sr-only">
                  <Trans
                    i18nKey="pollStatsAllInviteesResponded"
                    defaults="All invitees responded"
                  />
                </span>
              )}
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
/**
 * The date with the most availability and how many can make it. When several
 * tie, it opens on the recommended one (most yes, then fewest if need be,
 * then earliest) and the arrows beside Pick this date step through the others;
 * Picking applies to the date shown.
 */
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
  const { t } = useTranslation();
  const poll = usePoll();
  const { formatDateTime } = useDateTime();
  const finalizeDialog = useDialog();
  const top = React.useMemo(() => {
    const ranked = rankOptionsByPopularity({ options, participants });
    const availability = (option: (typeof ranked)[number]) =>
      option.votes.yes.length + option.votes.ifNeedBe.length;
    const best = ranked[0] ? availability(ranked[0]) : 0;
    if (best === 0) {
      return [];
    }
    return ranked
      .filter((option) => availability(option) === best)
      .sort(
        (a, b) =>
          b.votes.yes.length - a.votes.yes.length ||
          a.votes.ifNeedBe.length - b.votes.ifNeedBe.length ||
          a.startTime.getTime() - b.startTime.getTime(),
      );
  }, [options, participants]);
  const [rawIndex, setIndex] = React.useState(0);
  // The tie list can shrink as responses arrive; keep the index inside it.
  const index = Math.max(0, Math.min(rawIndex, top.length - 1));
  const current = top[index];
  // Captured on open, so a refresh that reranks dates can't swap the date
  // the dialog is booking or has booked.
  const [finalizeOptionId, setFinalizeOptionId] = React.useState<string | null>(
    null,
  );
  const floating = timeZone === null;

  return (
    <StatCard>
      <StatCardHeader>
        <StatCardLabel className="self-center font-medium text-base text-foreground">
          <Trans i18nKey="pollStatsBestDate" defaults="Best date" />
        </StatCardLabel>
        <div className="flex shrink-0 items-center gap-1">
          {top.length > 1 ? (
            <div className="flex shrink-0 items-center gap-1">
              <span className="sr-only" aria-live="polite">
                <Trans
                  i18nKey="pollStatsTiedPosition"
                  defaults="{position} of {count} tied"
                  values={{ position: index + 1, count: top.length }}
                />
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("pollStatsPreviousTiedDate", {
                  defaultValue: "Previous tied date",
                })}
                disabled={index === 0}
                onClick={() => setIndex(index - 1)}
              >
                <ChevronLeftIcon aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("pollStatsNextTiedDate", {
                  defaultValue: "Next tied date",
                })}
                disabled={index === top.length - 1}
                onClick={() => setIndex(index + 1)}
              >
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          ) : null}
          {canFinalize && current ? (
            <Button
              size="sm"
              onClick={() => {
                posthog?.capture("poll_finalize:dialog_open", {
                  source: "best_date_card",
                  ...pollEventProperties({
                    pollId: poll.id,
                    spaceId: poll.spaceId,
                  }),
                });
                setFinalizeOptionId(current.id);
                finalizeDialog.trigger();
              }}
            >
              <Trans
                i18nKey="pollResultsPickThisDate"
                defaults="Pick this date"
              />
            </Button>
          ) : null}
        </div>
      </StatCardHeader>
      <StatCardFooter className="flex-wrap items-end gap-y-2">
        {current ? (
          <StatCardValue className="whitespace-nowrap text-xl">
            {formatDateTime(
              current.startTime,
              "weekdayMonthDayShort",
              optionZone(current, floating),
            )}
            {current.duration > 0 ? (
              <>
                <span
                  aria-hidden="true"
                  className="mx-1.5 text-muted-foreground"
                >
                  ·
                </span>
                <span className="tabular-nums">
                  {formatDateTime(
                    current.startTime,
                    "time",
                    optionZone(current, floating),
                  )}
                </span>
              </>
            ) : null}
          </StatCardValue>
        ) : (
          <span className="text-muted-foreground text-sm">
            {participants.length > 0 ? (
              <Trans
                i18nKey="pollStatsNoAvailableDate"
                defaults="No dates with availability yet"
              />
            ) : (
              <Trans
                i18nKey="pollStatsNoBestDate"
                defaults="Waiting for responses"
              />
            )}
          </span>
        )}
        {current ? (
          <span className="flex shrink-0 items-center">
            <span className="sr-only">
              <Trans
                i18nKey="pollStatsCanMakeItOfTotal"
                defaults="{count} of {total} can make it"
                values={{
                  count:
                    current.votes.yes.length + current.votes.ifNeedBe.length,
                  total: participants.length,
                }}
              />
            </span>
            <ProgressDonut
              value={current.votes.yes.length}
              secondary={current.votes.ifNeedBe.length}
              max={participants.length}
            />
          </span>
        ) : null}
      </StatCardFooter>
      {finalizeOptionId ? (
        <FinalizeDialog
          {...finalizeDialog.dialogProps}
          optionId={finalizeOptionId}
        />
      ) : null}
    </StatCard>
  );
}

/** A share as a ring: invitees who responded, or respondents who can make a date. */
function ProgressDonut({
  value,
  secondary = 0,
  max,
}: {
  value: number;
  /** A second share after the first, in amber: if need be votes. */
  secondary?: number;
  max: number;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const primaryLength = max > 0 ? (value / max) * circumference : 0;
  const secondaryLength = max > 0 ? (secondary / max) * circumference : 0;
  // Round caps would overlap where two segments meet.
  const linecap = secondary > 0 ? "butt" : "round";
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
        strokeWidth="4"
        className="stroke-foreground/10"
      />
      {primaryLength > 0 ? (
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap={linecap}
          strokeDasharray={`${primaryLength} ${circumference}`}
          className="stroke-green-500"
        />
      ) : null}
      {secondaryLength > 0 ? (
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap={linecap}
          strokeDasharray={`${secondaryLength} ${circumference}`}
          strokeDashoffset={-primaryLength}
          className="stroke-amber-400"
        />
      ) : null}
    </svg>
  );
}
