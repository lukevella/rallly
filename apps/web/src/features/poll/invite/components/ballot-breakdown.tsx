"use client";

import { PopoverTitle } from "@rallly/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { ChevronDownIcon, PencilIcon } from "lucide-react";
import { VoteBar } from "@/features/poll/components/vote-bar";
import VoteIcon from "@/features/poll/components/vote-icon";
import {
  EventCalendarCard,
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import type {
  Ballot,
  BallotBreakdownEntry,
  BallotTallies,
  BallotVote,
} from "../types";
import { optionBreakdown } from "../utils";

/**
 * The breakdown worked out from the tallies. Rendered inside the popover, so
 * the list is only built while it is open.
 */
export function BallotOptionBreakdown({
  option,
  timeZone,
  total,
  tallies,
  votes,
  activeResponseId,
  liveVote,
}: {
  option: Ballot["options"][number];
  timeZone: string | null;
  total: number;
  tallies: BallotTallies;
  votes: (BallotVote | null)[];
  activeResponseId: string | null;
  liveVote: BallotVote | undefined;
}) {
  const { t } = useTranslation();
  return (
    <BallotBreakdown
      option={option}
      timeZone={timeZone}
      total={total}
      entries={optionBreakdown({
        tallies,
        votes,
        activeResponseId,
        liveVote,
        viewerName: t("you", { defaultValue: "You" }),
      })}
    />
  );
}

/** Who answered what on one option, as the body of the count's popover. */
export function BallotBreakdown({
  option,
  timeZone,
  entries,
  total,
}: {
  option: Ballot["options"][number];
  timeZone: string | null;
  /** Ordered as they should be listed. */
  entries: BallotBreakdownEntry[];
  total: number;
}) {
  const start = new Date(option.startTime);
  const allDay = option.duration === 0;
  const groups = {
    yes: entries.filter((entry) => entry.vote === "yes"),
    ifNeedBe: entries.filter((entry) => entry.vote === "ifNeedBe"),
    no: entries.filter((entry) => entry.vote === "no"),
  };
  const available = groups.yes.length + groups.ifNeedBe.length;

  return (
    <>
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-3">
          <EventCalendarCard
            start={start}
            allDay={allDay}
            timeZone={timeZone}
          />
          <PopoverTitle className="min-w-0 font-normal text-sm">
            <EventDate
              value={start}
              allDay={allDay}
              timeZone={timeZone}
              preset="weekday"
              className="block truncate font-medium"
            />
            <EventTimeRange
              start={start}
              end={new Date(start.getTime() + option.duration * 60_000)}
              allDay={allDay}
              timeZone={timeZone}
              className="block truncate text-muted-foreground"
            />
          </PopoverTitle>
        </div>
        <div className="flex items-center gap-3">
          {/* bg-muted matches the popover in dark mode, hiding the track. */}
          <VoteBar
            className="flex-1 dark:bg-foreground/15"
            yes={groups.yes.length}
            ifNeedBe={groups.ifNeedBe.length}
            total={total}
          />
          <span
            aria-hidden="true"
            className="text-muted-foreground text-xs tabular-nums"
          >
            {available}/{total}
          </span>
        </div>
      </div>
      {entries.length > 0 ? (
        <div className="max-h-[min(20rem,50dvh)] space-y-1 overflow-y-auto border-t p-3">
          <BreakdownGroup
            vote="yes"
            label={<Trans i18nKey="yes" defaults="Yes" />}
            entries={groups.yes}
          />
          <BreakdownGroup
            vote="ifNeedBe"
            label={<Trans i18nKey="ifNeedBe" defaults="If need be" />}
            entries={groups.ifNeedBe}
          />
          <BreakdownGroup
            vote="no"
            label={<Trans i18nKey="no" defaults="No" />}
            entries={groups.no}
          />
        </div>
      ) : (
        <p className="border-t p-3 text-center text-muted-foreground text-sm">
          <Trans
            i18nKey="noVotes"
            defaults="No one has voted for this option"
          />
        </p>
      )}
    </>
  );
}

function BreakdownGroup({
  vote,
  label,
  entries,
}: {
  vote: BallotVote;
  label: React.ReactNode;
  entries: BallotBreakdownEntry[];
}) {
  if (entries.length === 0) {
    return null;
  }
  // "No" starts collapsed: the least useful group for picking a time.
  return (
    <details open={vote !== "no"} className="group">
      <summary className="-mx-1 flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1 py-0.5 text-muted-foreground text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <VoteIcon round type={vote} className="size-3.5 shrink-0" />
        {label}
        <span className="tabular-nums">{entries.length}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="ml-auto size-3.5 shrink-0 transition-transform group-not-open:-rotate-90"
        />
      </summary>
      <ul className="space-y-1 pt-1.5 pb-3 pl-5 group-last:pb-0">
        {entries.map((entry) => (
          <li key={entry.responseId} className="flex items-center gap-1.5">
            <span className="min-w-0 truncate text-xs">{entry.name}</span>
            {/* An unsaved answer, drawn like the Pro badge. */}
            {entry.viewer?.unsaved ? (
              <Tooltip>
                <TooltipTrigger
                  render={<span />}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                >
                  <PencilIcon aria-hidden="true" className="size-3" />
                  <span className="sr-only">
                    <Trans
                      i18nKey="voteStatusUnsaved"
                      defaults="Unsaved changes"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <Trans
                    i18nKey="voteStatusUnsaved"
                    defaults="Unsaved changes"
                  />
                </TooltipContent>
              </Tooltip>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
