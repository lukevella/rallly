import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { ClockIcon, PlusIcon } from "lucide-react";
import type * as React from "react";
import { useParticipants, usePermissions } from "@/features/poll/client";
import { useOptions, usePoll } from "@/features/poll/components/poll-context";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";
import { getOptionDateTimeLabel } from "@/lib/utils/date-time-utils";
import VoteIcon from "../vote-icon";
import { toggleVote } from "../vote-selector";
import { voteTint, voteTintHover } from "./vote-tint";

const TimeRange: React.FunctionComponent<{
  start: string;
  end: string;
  duration: string;
  showDuration: boolean;
  className?: string;
}> = ({ start, end, duration, showDuration, className }) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-start gap-1.5 self-stretch font-normal text-muted-foreground text-xs",
        className,
      )}
    >
      {showDuration ? (
        <>
          <span data-testid="option-start-time">{start}</span>
          <Tooltip>
            <TooltipTrigger delay={0} className="flex items-center gap-x-1">
              <ClockIcon className="size-3" />
              {duration}
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {start} - {end}
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        // Every option lasts the same, so the duration says nothing about
        // this one; the range stays a hover away on the start time.
        <Tooltip>
          <TooltipTrigger delay={0} data-testid="option-start-time">
            {start}
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {start} - {end}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

/**
 * Names the header's vote row while it is in use: a new response, or the
 * participant whose response is being edited.
 */
function ResponseLabel() {
  const form = useVotingForm();
  const { participants } = useParticipants();
  const participantId = form.watch("participantId");
  const participant = participantId
    ? participants.find((p) => p.id === participantId)
    : undefined;

  return (
    <div className="flex min-w-0 items-center gap-2 text-left font-medium text-primary text-sm">
      <span className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="truncate">
        {participant ? (
          <Trans
            i18nKey="pollHeaderEditingResponse"
            defaults="Editing {name}"
            values={{ name: participant.name }}
          />
        ) : (
          <Trans i18nKey="pollHeaderYourResponse" defaults="Your response" />
        )}
      </span>
    </div>
  );
}

/** Starts another response, for a viewer who may add one. */
function AddResponseButton() {
  const { canAddNewParticipant } = usePermissions();
  const form = useVotingForm();
  if (!canAddNewParticipant) {
    return null;
  }
  return (
    <Button
      size="xs"
      variant="ghost"
      className="-ml-2 text-muted-foreground"
      data-testid="add-participant-button"
      onClick={() => form.newParticipant()}
    >
      <PlusIcon data-icon="inline-start" />
      <Trans i18nKey="addResponse" defaults="Add response" />
    </Button>
  );
}

type HeaderOption = ReturnType<typeof useOptions>["options"][number];

/**
 * While responding, each option's header is the vote control: the whole
 * cell, labelled by the time it stands for, so the click lands on the option
 * the viewer means rather than a small box in a row of identical ones.
 * Clicking cycles the answer, as the box did.
 */
function HeaderVoteButton({
  option,
  index,
  showDuration,
}: {
  option: HeaderOption;
  index: number;
  showDuration: boolean;
}) {
  const { t } = useTranslation();
  const { poll } = usePoll();
  const form = useVotingForm();
  const vote = form.watch(`votes.${index}`);
  const type = vote?.type;

  const voteLabel =
    type === "yes"
      ? t("yes", { defaultValue: "Yes" })
      : type === "ifNeedBe"
        ? t("ifNeedBe", { defaultValue: "If need be" })
        : type === "no"
          ? t("no", { defaultValue: "No" })
          : t("pending", { defaultValue: "Pending" });

  return (
    <button
      type="button"
      data-testid="vote-selector"
      aria-label={`${getOptionDateTimeLabel(option)}, ${voteLabel}`}
      onClick={() => {
        form.setValue(`votes.${index}`, {
          optionId: option.optionId,
          type: toggleVote(type, poll.allowTentativeVotes),
        });
      }}
      className={cn(
        "flex h-9 w-full items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1.5 text-left font-normal text-muted-foreground text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        type
          ? [voteTint[type], voteTintHover[type]]
          : "bg-gray-500/5 ring-1 ring-gray-500/15 ring-inset hover:bg-gray-500/10 dark:bg-white/5 dark:ring-white/8 dark:hover:bg-white/10",
      )}
    >
      {option.type === "date" ? (
        <span className="text-foreground">{`${option.dow} ${option.day}`}</span>
      ) : null}
      {option.type === "timeSlot" ? (
        <span className="flex items-center gap-1">
          <span className="text-foreground">{option.startTime}</span>
          {/* Inline, so the cell keeps the height of a participant row. */}
          {showDuration ? <span>· {option.duration}</span> : null}
        </span>
      ) : null}
      <VoteIcon type={type} glyph />
    </button>
  );
}

const TimelineRow = ({
  children,
  top,
  rowSpan = 0,
  corner,
}: React.PropsWithChildren<{
  top?: number;
  rowSpan?: number;
  /** Content for the sticky corner cell, bottom aligned. */
  corner?: React.ReactNode;
}>) => {
  return (
    <tr>
      {rowSpan > 0 ? (
        <th
          rowSpan={rowSpan}
          style={{ minWidth: 235, width: 235, top }}
          className="sticky left-0 z-30 border-b bg-card px-4 py-2 align-bottom"
        >
          {corner}
        </th>
      ) : null}
      {children}
    </tr>
  );
};

const monthRowHeight = 48;
const dayRowHeight = 32;

const PollHeader = ({ cornerStart }: { cornerStart?: React.ReactNode }) => {
  const { options } = useOptions();
  const votingForm = useVotingForm();
  const isVoting = votingForm.watch("mode") !== "view";
  const showDuration =
    new Set(
      options.flatMap((option) =>
        option.type === "timeSlot" ? [option.duration] : [],
      ),
    ).size > 1;

  const monthGroups: { month: string; year: string; count: number }[] = [];

  for (const option of options) {
    const last = monthGroups[monthGroups.length - 1];
    if (last?.month === option.month && last?.year === option.year) {
      last.count++;
    } else {
      monthGroups.push({ month: option.month, year: option.year, count: 1 });
    }
  }

  const dayGroups: {
    day: string;
    dow: string;
    month: string;
    year: string;
    count: number;
  }[] = [];

  for (const option of options) {
    const last = dayGroups[dayGroups.length - 1];
    if (
      last?.day === option.day &&
      last?.month === option.month &&
      last?.year === option.year
    ) {
      last.count++;
    } else {
      dayGroups.push({
        day: option.day,
        dow: option.dow,
        month: option.month,
        year: option.year,
        count: 1,
      });
    }
  }

  // A date poll's cells already name their day, so the day row is only kept
  // for screen readers, as the columns' headers, and takes no height.
  const isDatePoll = options[0]?.type === "date";
  const visibleDayRowHeight = isDatePoll ? 0 : dayRowHeight;
  const optionRowTop = monthRowHeight + visibleDayRowHeight;

  return (
    <>
      <TimelineRow
        top={0}
        rowSpan={3}
        corner={
          <div className="flex items-center gap-2">
            {cornerStart}
            {isVoting ? <ResponseLabel /> : <AddResponseButton />}
          </div>
        }
      >
        {monthGroups.map((group) => (
          <th
            key={`${group.month} ${group.year}`}
            scope="colgroup"
            colSpan={group.count}
            style={{ height: monthRowHeight }}
            className={cn("sticky top-0 z-10 bg-card text-left")}
          >
            <div className="sticky right-0 left-[236px] inline-flex h-5 gap-1 px-2 py-0.5 font-medium text-xs uppercase">
              <span data-testid="option-month">{group.month}</span>
              <span className="text-muted-foreground">{group.year}</span>
            </div>
          </th>
        ))}
      </TimelineRow>
      <TimelineRow top={monthRowHeight}>
        {dayGroups.map((group) => (
          <th
            key={`${group.year}-${group.month}-${group.day}`}
            scope="colgroup"
            colSpan={group.count}
            style={{ height: visibleDayRowHeight, top: monthRowHeight }}
            className={cn("sticky z-10 bg-card", isDatePoll && "p-0")}
          >
            <div
              style={{ width: `calc(100% / ${group.count})` }}
              className={cn(
                "sticky left-[236px] z-20 flex items-baseline gap-1 whitespace-nowrap px-2 text-xs",
                isDatePoll && "sr-only",
              )}
            >
              <span className="font-normal text-muted-foreground">
                {group.dow}
              </span>
              <span data-testid="option-day" className="font-medium">
                {group.day}
              </span>
            </div>
          </th>
        ))}
      </TimelineRow>
      <TimelineRow top={optionRowTop}>
        {options.map((option, index) => {
          return (
            <th
              key={option.optionId}
              data-col={index}
              scope="col"
              style={{ minWidth: 88, top: optionRowTop }}
              className={cn(
                "sticky z-20 border-b bg-card align-top",
                // While voting the cell matches a participant row: a 36px
                // tile with 6px either side.
                isVoting ? "px-1 py-1.5" : isDatePoll ? "p-0" : "px-2 pb-2.5",
              )}
            >
              {isVoting ? (
                <HeaderVoteButton
                  option={option}
                  index={index}
                  showDuration={showDuration}
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {option.type === "timeSlot" ? (
                    <TimeRange
                      start={option.startTime}
                      end={option.endTime}
                      duration={option.duration}
                      showDuration={showDuration}
                    />
                  ) : null}
                </div>
              )}
            </th>
          );
        })}
      </TimelineRow>
    </>
  );
};

export default PollHeader;
