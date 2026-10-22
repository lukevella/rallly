"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import {
  ChevronRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  CircleXIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import { FinalizePollDialog } from "@/features/poll/components/finalize-poll-dialog";
import { VoteBar } from "@/features/poll/components/vote-bar";
import type { VoteType } from "@/features/poll/constants";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";

type Slot = { startTime: Date; duration: number };

type RankedOption = Slot & {
  id: string;
  score: number;
  votes: { type: VoteType; count: number }[];
};

function SlotLabel({
  slot,
  timeZone,
}: {
  slot: Slot;
  timeZone: string | null;
}) {
  const allDay = slot.duration === 0;
  return (
    <>
      <EventDate
        value={slot.startTime}
        allDay={allDay}
        timeZone={timeZone}
        preset="weekdayMonthDayShort"
      />
      {allDay ? null : (
        <>
          {" · "}
          <EventTimeRange
            start={slot.startTime}
            end={new Date(slot.startTime.getTime() + slot.duration * 60_000)}
            allDay={false}
            timeZone={timeZone}
          />
        </>
      )}
    </>
  );
}

const count = (option: RankedOption, type: VoteType) =>
  option.votes.find((vote) => vote.type === type)?.count ?? 0;

/**
 * How much of the group can make an option: green for yes, then amber for if
 * need be, around a ring of every participant.
 */
function PopularityDonut({
  yes,
  ifNeedBe,
  total,
}: {
  yes: number;
  ifNeedBe: number;
  total: number;
}) {
  const { t } = useTranslation();
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const arc = (value: number) =>
    total > 0 ? (value / total) * circumference : 0;
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={t("pollNextStepAvailability", {
        defaultValue: "{available} of {total} available",
        available: yes + ifNeedBe,
        total,
      })}
      className="-rotate-90"
    >
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        strokeWidth="3"
        className="stroke-gray-400 dark:stroke-gray-500"
      />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        strokeWidth="3"
        strokeDasharray={`${arc(yes)} ${circumference}`}
        className="stroke-green-500"
      />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        strokeWidth="3"
        strokeDasharray={`${arc(ifNeedBe)} ${circumference}`}
        strokeDashoffset={-arc(yes)}
        className="stroke-amber-400"
      />
    </svg>
  );
}

/**
 * Where the thread ends, like a pull request's merge box: a header that
 * summarizes the poll's state and, while it is still deciding, expands to
 * every option ranked by popularity. One call to action finalizes the
 * selected option, the most popular by default.
 */
export function NextStepCard({
  options,
  participantCount,
}: {
  /** Every option, most popular first. */
  options: RankedOption[];
  participantCount: number;
}) {
  const poll = usePoll();
  const finalizeDialog = useDialog();
  const [expanded, setExpanded] = React.useState(false);
  const top = options[0];
  const leading = top && top.score > 0 ? top : undefined;
  const tiedCount = leading
    ? options.filter((option) => option.score === leading.score).length
    : 0;
  const [selectedId, setSelectedId] = React.useState(top?.id);
  const selected =
    options.find((option) => option.id === selectedId) ?? options[0];
  const deciding =
    (poll.status === "open" ||
      (poll.status === "closed" && poll.closedReason !== "auto")) &&
    options.length > 0;

  const summary = (() => {
    switch (poll.status) {
      case "canceled":
        return {
          icon: <CircleXIcon className="text-rose-500" />,
          title: (
            <Trans
              i18nKey="pollNextStepCanceled"
              defaults="This poll was canceled"
            />
          ),
        };
      case "scheduled":
        return {
          icon: <CircleCheckIcon className="text-green-500" />,
          title: poll.event ? (
            <Trans
              i18nKey="pollNextStepScheduledFor"
              defaults="Scheduled for <date></date>"
              components={{
                date: (
                  <SlotLabel
                    slot={{
                      startTime: poll.event.start,
                      duration: poll.event.duration,
                    }}
                    timeZone={poll.timeZone}
                  />
                ),
              }}
            />
          ) : (
            <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
          ),
        };
    }
    if (poll.status === "closed" && poll.closedReason === "auto") {
      return {
        icon: <CircleIcon className="text-muted-foreground" />,
        title: (
          <Trans
            i18nKey="pollNextStepAllPassed"
            defaults="Every option has passed"
          />
        ),
      };
    }
    return {
      icon: leading ? (
        <PopularityDonut
          yes={count(leading, "yes")}
          ifNeedBe={count(leading, "ifNeedBe")}
          total={participantCount}
        />
      ) : (
        <CircleDashedIcon className="text-amber-500" />
      ),
      title: leading ? (
        tiedCount > 1 ? (
          <Trans
            i18nKey="pollNextStepTied"
            defaults="{count} options are tied for the lead"
            values={{ count: tiedCount }}
          />
        ) : (
          <Trans
            i18nKey="pollNextStepMostPopular"
            defaults="<date></date> is the most popular"
            components={{
              date: <SlotLabel slot={leading} timeZone={poll.timeZone} />,
            }}
          />
        )
      ) : participantCount > 0 ? (
        <Trans
          i18nKey="pollNextStepNobodyAvailable"
          defaults="Nobody is available for any option yet"
        />
      ) : (
        <Trans
          i18nKey="pollNextStepNoResponses"
          defaults="Waiting for responses"
        />
      ),
    };
  })();

  return (
    <div className="overflow-hidden rounded-[18px] border border-card-border bg-card text-sm">
      <button
        type="button"
        disabled={!deciding}
        aria-expanded={deciding ? expanded : undefined}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 p-4 text-left outline-none focus-visible:bg-accent enabled:hover:bg-accent/50"
      >
        <span className="flex size-8 shrink-0 items-center justify-center [&_svg]:size-8">
          {summary.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{summary.title}</span>
          <span className="block text-muted-foreground text-xs">
            {poll.status === "closed" && poll.closedReason !== "auto" ? (
              <>
                <Trans
                  i18nKey="pollNextStepClosed"
                  defaults="Responses are closed"
                />
                {" · "}
              </>
            ) : null}
            <Trans
              i18nKey="pollNextStepCounts"
              defaults="{responses, plural, one {# response} other {# responses}} · {options, plural, one {# option} other {# options}}"
              values={{
                responses: participantCount,
                options: options.length,
              }}
            />
          </span>
        </span>
        {deciding ? (
          <ChevronRightIcon
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
        ) : null}
      </button>
      {deciding && expanded ? (
        <RadioGroup
          value={selected?.id}
          onValueChange={(value) => setSelectedId(value as string)}
          // One grid for every row (subgrid), so dates share a column sized to
          // the longest and every bar starts at the same point and fills the
          // rest of the width.
          className="grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 border-card-border border-t px-2 py-3"
        >
          {options.map((option) => (
            // biome-ignore lint/a11y/noLabelWithoutControl: the radio inside is the control
            <label
              key={option.id}
              className="col-span-full grid cursor-pointer grid-cols-subgrid items-center rounded-md px-2 py-2.5 hover:bg-accent/50"
            >
              <RadioGroupItem value={option.id} />
              <span className="truncate text-xs">
                <SlotLabel slot={option} timeZone={poll.timeZone} />
              </span>
              <VoteBar
                yes={count(option, "yes")}
                ifNeedBe={count(option, "ifNeedBe")}
                total={participantCount}
              />
              <span className="text-right text-muted-foreground text-xs tabular-nums">
                {count(option, "yes") + count(option, "ifNeedBe")}/
                {participantCount}
              </span>
            </label>
          ))}
        </RadioGroup>
      ) : null}
      {deciding && selected ? (
        <div className="border-card-border border-t bg-muted/40 px-4 py-3">
          <Button
            shape="rounded"
            onClick={() => {
              posthog?.capture("poll_finalize:dialog_open");
              finalizeDialog.trigger();
            }}
          >
            <Trans
              i18nKey="pollNextStepFinalizeDate"
              defaults="Finalize <date></date>"
              components={{
                date: <SlotLabel slot={selected} timeZone={poll.timeZone} />,
              }}
            />
          </Button>
          <FinalizePollDialog
            {...finalizeDialog.dialogProps}
            optionId={selected.id}
          />
        </div>
      ) : null}
      {poll.status === "scheduled" ? (
        <div className="border-card-border border-t bg-muted/40 px-4 py-3">
          <Link href="/events" className={buttonVariants({ shape: "rounded" })}>
            <Trans i18nKey="pollNextStepGoToEvent" defaults="Go to event" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
